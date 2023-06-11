const {
    // 浏览器窗口
    BrowserWindow,
    // 主进程
    app,
    Menu,
    ipcMain,
    remote,
    session
} = require('electron')
const path = require('path')
const fo = require('./lib/FileOperator')

// 导入加密模块
const crypto = require('crypto');
const fse = require('fs-extra')
const natural = require('natural');
const changeCase = require('change-case');
const sbd = require('sbd');
const nlp = require('compromise');
const lodash = require('lodash')
const tokenizer = new natural.WordTokenizer();


module.exports = {
    /**
     * 设置渲染进程所处的窗口标题
     * @param {string} title 标题名
     */
    electronAPI: {
        setTitle: (event, title) => {
            const webContents = event.sender
            const win = BrowserWindow.fromWebContents(webContents)
            win.setTitle(title.toString())
        },
        clearData: (e, mode) => {
            // 获取默认的会话实例
            let defaultSession = session.defaultSession

            switch (mode) {
                case 0:
                    clearCache()
                    break;
                case 1:
                    clearStorage()
                    break;
                default:
                    clearCache()
                    clearAllStorage()
                    break;
            }

            function clearCache() {
                // 清空缓存
                defaultSession.clearCache(() => {
                    console.log('Browser cache cleared.')
                })
            }

            function clearStorage() {
                // 只清除本地存储和IndexedDB
                defaultSession.clearStorageData({
                    storages: ['localstorage', 'indexeddb']
                }, () => {
                    console.log('Local storage and IndexedDB cleared.')
                })
            }

            function clearAllStorage() {
                // 清除所有存储数据
                defaultSession.clearStorageData({}, () => {
                    console.log('All storage data cleared.')
                })
            }
        }
    },
    action: {
        writeFile: (event, opn) => {
            const opinion = {
                ...{
                    sync: false,
                    legal: false,
                },
                ...opn
            }
            return new Promise(resolve => {
                opn.path = path.join(__dirname, opn.path)
                fo.opt.createFile(opinion)
                    .then(dir => {
                        resolve(dir)
                    })
            })
        },
        readFile: (event, opn) => {
            const opinion = typeof opn == 'string' ? {
                file: opn
            } : {
                ...{
                    sync: false,
                    legal: false,
                },
                ...opn
            }
            return new Promise(resolve => {
                // opn.path = path.join(__dirname, opn.path)
                fo.opt.readFile(opinion)
                    .then(dir => {
                        resolve(dir)
                    })
            })
        },
        createFile: async (event, _path) => {
            if (Array.isArray(_path)) {
                _path.forEach(e => {
                    fse.ensureFileSync(path.join(__dirname, e));
                })
            } else {
                fse.ensureFileSync(path.join(__dirname, _path));
            }
        },
        exist: (event, _path) => {
            // 判断文件是否存在
            return fse.pathExistsSync(path.join(__dirname, _path))
        },
        deleteFolder: (e, pathSet) => {
            pathSet = Array.isArray(pathSet) ? pathSet : [pathSet]
            pathSet.forEach(e => {
                e = path.join(__dirname, e)
                fse.remove(e)
                    .then(() => console.log(`remove "${e}" success`))
            })
        },
        hash: (event, obj, hashType) => {
            let hashVal = [];

            obj.forEach(e => {
                let hash;
                switch (hashType) {
                    case 'md5':
                        // 规定使用哈希算法中的MD5算法
                        hash = crypto.createHash('md5');
                        break;
                    case 'SHA-256':
                    default:
                        // 可任意多次调用update(),效果相当于多个字符串相加
                        hash = crypto.createHash('sha256');
                        break;
                }
                hash.update(e);
                // hash.digest('hex')表示输出的格式为16进制
                hashVal.push(hash.digest('hex'));
            });

            return hashVal;
        },

    },
    extraAPI: {
        natural: (event, inputText) => {
            let set = []
            let word = []; {
                // natural库
                // Tokenizer用于将字符串分割成单词或词组
                // const tokenizer = new natural.WordTokenizer();

                // SentenceTokenizer用于将字符串分割成句子
                const sentenceTokenizer = new natural.SentenceTokenizer();

                // 将字符串inputText分割成单词或词组，并打印每个分割出来的项
                const tokens = tokenizer.tokenize(inputText);
                word = tokens;
                // console.log("Tokens:", tokens);

                // 将字符串inputText分割成句子，并打印每个分割出来的句子
                const sentences = sentenceTokenizer.tokenize(inputText);
                // console.log("Sentences:", sentences);

                set.push(sentences)
            } {
                // sbd
                const options = {
                    newline_boundaries: true,
                    html_boundaries: false
                };

                const sentences = sbd.sentences(inputText, options);
                set.push(sentences)
            } {
                // nlp
                const doc = nlp(inputText);
                const sentences = doc.sentences().out('array');
                set.push(sentences)
            }
            return new Promise(resolve => {
                let sts = Array.from(new Set(set.flat()));
                let result = []
                sts.forEach((e, i) => {
                    let temp = e.replace(/\n/g, ' ')
                    temp = temp.trim();
                    if (temp.includes(' ')) {
                        result.push(temp);
                    }
                })
                resolve([word, result])
            })
        },
        fixCase: (event, strSet) => {
            return new Promise(resolve => {
                let tempSet = []
                strSet.forEach(e => {
                    tempSet.push(['', lodash.capitalize(e)])
                    // tempSet.push(['sentence-no-mark', changeCase.sentenceCase(e)])
                })
                resolve(tempSet)
            })
        },
        isWord: (event, str) => {
            const tokens = tokenizer.tokenize(str);
            // 如果是1个单词，则使用Jaro-Winkler距离算法对该单词和原始字符串进行比较，以判断它们是否相似。
            // 如果相似度高于0.9，则认为该字符串是一个单词。
            return tokens.length === 1 && natural.JaroWinklerDistance(tokens[0], str) > 0.9;
        }
    },
}