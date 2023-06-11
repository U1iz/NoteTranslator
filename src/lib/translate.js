window.transForm = {
    word: {},
    phrase: {},
    sentence: {},
    ps: {}
}

/* 用于翻译单词 */
window.translator = set => {
    return new Promise(resolve => {
        tw(set.word, true)
            .then(ts(set.sentence))
            .then(tp(set.phrase))
            .then(res => {
                let max = 1024;
                let timer = setInterval(() => {
                    switch (Object.keys(res.word).length) {
                        case set.word.length:
                            clearInterval(timer)
                            resolve(res)
                            break;

                        default:
                            if (max <= 0) {
                                clearInterval(timer)
                                resolve(res)
                                console.log(res);
                            }
                            max--;
                            console.log(set.word.length, Object.keys(res.word).length);
                            break;
                    }
                }, 10)
            })
    })
}

function tw(str, native) {
    return new Promise(resolve => {
        transWord(str, native, call)

        function call(rrr) {
            resolve(rrr)
        }
    })
}

function tp(str) {
    return new Promise(resolve => {
        transPhrase(str, call)

        function call(rrr) {
            resolve(rrr)
        }
    })
}

function ts(str) {
    return new Promise(resolve => {
        transSentence(str, call)

        function call(rrr) {
            resolve(rrr)
        }
    })
}



window.transWord = (wordSet, native, callBack) => {
    return new Promise(async resolve => {
        transAjax(wordSet[0])
            .then(data => {
                // wordSet.shift();
                wordSet = wordSet.slice(1)
                // 通过此判断是否为单词
                if (data.result && typeof data.result != 'object') {
                    data = JSON.parse(data.result)
                    let temp = null;
                    try {
                        if (data.voice) {
                            const regex = /[\[\]{}\s]+/g; // 匹配所有方括号、大括号和空格符
                            temp = JSON.parse(`{${JSON.stringify(data.voice).replace(regex, "")}}`)
                        }
                    } catch (err) {
                        console.log(data, err);
                    }
                    getAudio(data.src)
                        .then(au => {
                            const tempDate = {
                                mean: data.content,
                                voice: temp,
                                audio: au
                            }
                            if (native) {
                                transForm.word[data.src] = tempDate;
                            } else {
                                transForm.ps[data.src] = tempDate;
                            }
                        })
                } else if (data.data) {
                    mean = data.data[0].dst;
                    src = data.data[0].src
                    getAudio(src)
                        .then(au => {
                            const tempDate = {
                                mean: mean,
                                audio: au
                            }
                            if (native) {
                                transForm.word[src] = tempDate;
                            } else {
                                transForm.ps[src] = tempDate;
                            }
                        })
                }
                if (wordSet.length) {
                    transWord(wordSet, native, callBack)
                } else {
                    if (!callBack) {} else {
                        callBack(transForm)
                    }
                    resolve(transForm);
                }
            }).catch(err => console.log(wordSet, err))
    });
}

window.transPhrase = (phraseSet, callBack) => {
    return new Promise(resolve => {
        if (phraseSet && phraseSet.length) {
            const src_text = phraseSet[0];
            transAjax(src_text.endsWith('.') ? src_text : src_text + '.')
                .then(data => {
                    // phraseSet.shift();
                    phraseSet = phraseSet.slice(1)
                    data = data.data[0];
                    // 获取音频
                    getAudio(src_text)
                        .then(au => {
                            transForm.phrase[src_text] = {
                                mean: data.dst,
                                audio: au
                            };
                            tw(src_text.split(' '))
                                .then(() => {
                                    if (phraseSet.length) {
                                        transPhrase(phraseSet, callBack)
                                    } else {
                                        callBack && callBack(transForm);
                                        resolve(transForm);
                                        // console.log(transForm);
                                    }
                                })
                        })
                })
        } else {
            resolve(transForm);
        }
    })
}

window.transSentence = (sentence, callBack) => {
    return new Promise(resolve => {
        if (sentence && sentence.length) {
            transAjax(sentence[0].endsWith('.') ? sentence[0] : sentence[0] + '.')
                .then(data => {
                    // sentence.shift();
                    sentence = sentence.slice(1)
                    data = data.data[0]
                    // 获取音频
                    getAudio(data.src)
                        .then(au => {
                            transForm.sentence[data.src] = {
                                split: [],
                                audio: au
                            }
                            data.result.forEach((e, i) => {
                                transForm.sentence[data.src].split[i] = e[1];
                            });

                            // 字字翻译
                            transWord((data.src).replace(/[^A-Za-z\s]/g, "").split(' '), (function () {
                                if (sentence.length) {
                                    transSentence(sentence)
                                } else {
                                    callBack && callBack(transForm);
                                    resolve(transForm);
                                    // console.log(transForm);
                                }
                            }()))
                        })

                })
        } else {
            resolve(transForm);
        }
    })
}
window.getAudio = (str) => {
    const api = [
        'https://fanyi.baidu.com/gettts?lan=en&spd=3&source=web&text=',
        'https://fanyi.baidu.com/gettts?lan=uk&spd=3&source=web&text='
    ]
    let temp = []
    return new Promise(resolve => {
        api.forEach((e, i) => {
            fetch(e + str)
                .then(response => response.blob()) // 将响应转换为blob对象
                .then(blob => {
                    const reader = new FileReader(); // 创建一个FileReader对象来读取数据
                    reader.readAsDataURL(blob); // 以DataURL的格式读取数据
                    reader.onloadend = () => { // 文件读取完成后执行回调函数
                        // const base64Data = reader.result.slice(reader.result.indexOf(',') + 1); // 去掉前缀，只保留实际的base64编码字符串
                        const base64Data = reader.result
                        temp[i] = base64Data;
                        resolve(temp)
                    };
                })
        })
        return temp;
    })
}

function transAjax(str) {
    return new Promise((resolve, reject) => {
        fetch('https://fanyi.baidu.com/transapi', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'en',
                    to: 'zh',
                    query: str,
                    source: 'txt'
                })
            })
            .then(res => res.json())
            .then(data => resolve(data))
            .catch(err => reject(str, err))
    });
}

function langDetect(str) {
    // 判断语言
    return new Promise(resolve => {
        fetch('https://fanyi.baidu.com/langdetect?query=' + str)
            .then(res => res.json())
            .then(data => resolve(data.lan))
    })
}