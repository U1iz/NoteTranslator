const file_info = {
    history: './data/history.json'
}; {
    // 接口一
    const input = $('#free-translate-block').children('textarea:first-child')[0]
    const output = $('#free-translate-block').children('textarea:last-child')[0]

    window.action.readFile(file_info.history)
        .then(res => {
            let history = isJSON(res);
            if (history) {
                input.value = history.search.slice(-1)[0].val
                textTranslate()
            }
        })
    input.onpaste = () => {
        // 使用异步获取
        setTimeout(() => {
            window.extraAPI.isWord('input')
                .then(res => console.log(res))
        })
    }
    input.addEventListener('input', textTranslate)
    document.body.addEventListener('click', e => {
        if (e.target.innerText != '…') {
            $('.menu-add').remove()
            $('.menu-on').removeClass('menu-on')
        }
    })

    let timer_history = null;

    function textTranslate() {
        const val = input.value.trim(); {
            // 搜索记录记忆模块
            clearTimeout(timer_history)
            timer_history = setTimeout(() => {
                // 以防万一，先创建文件，再操作文件内容
                if (val.length) {
                    window.action.createFile(file_info.history)
                        .then(() => {
                            window.action.readFile(file_info.history)
                                .then(res => {
                                    let content = {
                                        ts: new Date().getTime(),
                                        val: val
                                    }
                                    let opinion = {
                                        path: 'data',
                                        file: 'history.json',
                                        flag: 'w'
                                    }
                                    res = isJSON(res)
                                    // 如果已存文件的最后一位正是目前的值，则不做操作
                                    if (!res || res.search.slice(-1)[0].val != content.val) {
                                        if (res) {
                                            // 如果已经有过历史记录，则追加
                                            res.search.push(content)
                                            opinion.content = JSON.stringify(res);
                                            window.action.writeFile(opinion)
                                                .then(res => console.log(res))
                                        } else {
                                            // 如果没有过历史记录，则覆写
                                            let wrap = {
                                                search: []
                                            }
                                            wrap.search.push(content)
                                            opinion.content = JSON.stringify(wrap);
                                            window.action.writeFile(opinion)
                                                .then(res => console.log(res))
                                        }
                                    }
                                })
                        })
                }
            }, 1000)
        }

        // -----------------
        transAjax(val)
            .then(res => {
                if (res.result) {
                    // 只有一个单词
                    res = JSON.parse(res.result);
                    let mean = res.content[0].mean
                    let voice = res.voice;
                    // console.log(mean, voice);
                    $('#desc h3').text(res.src)
                    $('#phonetic').html('');
                    $('#desc').show()
                    try {
                        voice.forEach(e => {
                            let k = Object.keys(e).toString();
                            $('#phonetic').append(k + `<span>${e[k]}</span>`)
                        })
                    } catch {
                        $('#desc').hide()
                    }

                    // 简化原始数据中的翻译部分
                    $('#mean').html('')
                    let meanTemp = {}
                    mean.forEach(e => {
                        let set = Object.keys(e.cont)
                        let obj = {
                            [e.pre]: set
                        }
                        meanTemp = {
                            ...meanTemp,
                            ...obj
                        }
                    })
                    for (let k in meanTemp) {
                        let ul = $('<ul class="mean-block">')
                        $('#mean').append(ul)
                        ul.append(`<li class='pre'>${k}</li>`)
                        meanTemp[k].forEach(e => {
                            ul.append(`<li class='mean'>${e}</li>`)
                        })
                    }
                } else {
                    // 多个单词
                    res = res.data;
                    try {
                        output.value = ''
                        res.forEach(e => {
                            // console.log(e.dst);
                            output.value += e.dst + '\n'
                        })
                    } catch {}
                    $('#desc').hide()
                }

            })
        $('#bubbles-block>ul').html('')

        if (input.value.length) {
            $('#bubbles-block').css('opacity', 1)
        } else {
            $('#bubbles-block').css('opacity', 0)
        }

        // 通过自然语言模块获取字符串中的单词和句子
        window.extraAPI.natural(input.value.replace(/\s{2,}/g, ' '))
            .then(result => {
                result.forEach((item, index) => {
                    // 通过将数组转为集合再转为数组来去重
                    result[index] = Array.from(new Set(item))
                })
                // 合法化语句的大小写
                window.extraAPI.fixCase(result[1])
                    .then(res => {
                        let temp = [];
                        res.forEach(e => {
                            if (e[1].length >= 3 && e[1].includes(' ')) {
                                temp.push(e)
                            }
                        })
                        // 单词小写
                        result[0].forEach((e, i) => {
                            result[0][i] = e.toLowerCase()
                        })
                        write(temp, 'bubble-list-sentence')
                        write(result[0], 'bubble-list-word')
                        event()
                    })


                function write(obj, id) {
                    $('#' + id).html('');
                    obj.forEach(e => {
                        if (e.length > 1) {
                            let li = $(`<li class="bubble-item"></li>`)
                            if (id.includes('sentence')) {
                                li.addClass(e[0])
                                e = e[1]
                            }
                            li.append(`${e.trim()}<span>…</span>`)
                            $('#' + id).append(li)
                        }
                    })
                }

                function event() {
                    // 用于存放添加的数据，为增加灵活性，引用自全局对象 transForm 后清空内部数组
                    let obj_temp = deepClone(window.transForm);
                    for (let k in obj_temp) {
                        obj_temp[k] = []
                    }
                    // 再删除附加值
                    delete obj_temp.ps;
                    // 添加到字典
                    $('.bubble-list>li.bubble-item span').on('click', e => {
                        // 先删除可能已经存在的菜单
                        $('.menu-add').remove()
                        const elem = e.target;
                        const li = elem.parentNode;
                        const value = li.childNodes[0].nodeValue;
                        // 根据 列表ul 的id生成不同的菜单，并将所属属性添加到选项的data-type
                        let menu = $(
                            `<div class="menu-add">${(elem.parentNode.parentNode.id).includes('word') ?
                                '<div data-type="word">添加为单词</div>' :
                                '<div data-type="sentence">添加为句子</div><div data-type="phrase">添加为词组</div>'
                            }</div>`
                        )
                        // 给li添加菜单并添加 menu-on 的class以提高z-index
                        $(elem.parentNode).append(menu)
                        $(li).addClass('menu-on')

                        $('.menu-add>div').on('click', e => {
                            // 当用户点击 之前生成的菜单选项，先获取key，判断是否已添加
                            const key = e.target.dataset['type'];
                            if (!obj_temp[key].includes(value)) {
                                // 如果未添加则添加进对象，并生成item
                                let val = value;
                                if (key == 'sentence') {
                                    // 如果是句子，加上句号
                                    val = value.endsWith('.') ? value : value +
                                        '.'
                                }
                                obj_temp[key][obj_temp[key].length] = val;
                                let bubble = $(
                                    `<li class="bubble-added" data-key="${key}" data-val="${val}">${key}: ${val}<span>x</span></li>`
                                )
                                $('#bubble-list-added').append(bubble)

                                // 显示提交模块
                                $('#bubble-submit').show()
                            }

                            // console.log(obj_temp[key], value);


                            $('.bubble-list>li.bubble-added span').on('click',
                                e => {
                                    // 获取 控件span 以及 列表父级ul
                                    const elem = e.target;
                                    const li = elem.parentNode;
                                    const ul = li.parentNode;
                                    // 移除代表需要添加的元素li
                                    elem.parentNode.remove()

                                    // 根据需要移除的元素位置删除该元素
                                    const index = obj_temp[li.dataset.key]
                                        .indexOf(li.dataset.val);
                                    obj_temp[li.dataset.key].splice(index,
                                        1);

                                    // 如果列表内没有元素，则代表没有需要添加的值，隐藏提交模块
                                    if (!ul.innerText.length) {
                                        $('#bubble-submit').hide()
                                    }
                                })

                            $('#bubble-submit button')[0].onclick = () => {
                                // 读取配置
                                let dic_opinion = {
                                    path: 'data',
                                    file: 'dictionary.json'
                                }

                                // 读取后更新json文件
                                window.action.readFile(dic_opinion)
                                    .then(res => {
                                        res = isJSON(res)
                                        // 获取到字典数据后执行同步
                                        dic_sync(res, dic_opinion)
                                    })
                            }
                        })
                    })

                    function dic_sync(dic_data, dic_opinion) {

                        // 先判断字典内容是否为json格式
                        if (dic_data) {
                            getObj()
                        } else {
                            let data = {
                                word: [],
                                phrase: [],
                                sentence: []
                            }

                            getObj(data)
                        }

                        function getObj(init_obj) {
                            if (init_obj) dic_data = init_obj
                            $('#bubble-submit li').get().forEach(e => {
                                const key = e.dataset.key,
                                    val = e.dataset.val
                                if (dic_data[key].includes(val)) {
                                    console.log('已存在', key, val);
                                } else {
                                    dic_data[key].push(val)
                                }
                            })
                        }

                        dic_opinion = {
                            ...dic_opinion,
                            ...{
                                flag: 'w',
                                content: JSON.stringify(dic_data)
                            }
                        }
                        window.action.writeFile(dic_opinion)
                            .then(res => {
                                $('#bubble-list-added').html('');
                                for (let k in obj_temp) {
                                    obj_temp[k] = []
                                }

                                $('#bubble-submit').hide()
                                // 更新result文件
                                translator(dic_data).then(res_data => {
                                    console.log(res_data);
                                    window.action.writeFile({
                                            ...dic_opinion,
                                            ...{
                                                file: 'result.json',
                                                flag: 'w',
                                                content: JSON.stringify(res_data)
                                            }
                                        })
                                        .then(res => console.log(res))
                                })
                            })
                    }
                }
            })
        /* let bs = (input.value).replace(/[^a-zA-Z]/g, ' ').split(/[\n\s]+/g)
        bs = Array.from(new Set(bs));
        bs.forEach(e => {
            e.length > 1 ?
                $('#bubbles').append(`<span>${e}</span>`) : null;
        }) */
    }
} {
    // 接口二
    {
        // 初始化
        const local = localStorage.getItem('used-string-length');
        if (local) {
            $('#used-string-length span').text(local)
        } else {
            localStorage.setItem('used-string-length', 0);
        }
    }
    const input = $('#dev-translate-block').children('textarea:first-child')[0]
    const output = $('#dev-translate-block').children('textarea:last-child')[0]
    const btn = $('#dev-translate-submit')[0]

    btn.onclick = () => {
        const val = Number(localStorage.getItem('used-string-length')) + input.value.length
        localStorage.setItem('used-string-length', val);

        $('#used-string-length span').text(val)
        langDetect(input.value)
            .then(res => {
                let from = 'en',
                    to = 'zh'
                switch (res) {
                    case 'zh':
                        from = 'zh'
                        to = 'en'
                        break;
                }

                $('#current-transType').html(`from: <span>${from}</span> to: <span>${to}</span>`)
                query({
                        q: input.value,
                        from: from,
                        to: to
                    })
                    .then(res => {
                        output.value = ''
                        res.trans_result.forEach(e => {
                            output.value += e.dst + '\n'
                        });
                    })
            })
    }
}