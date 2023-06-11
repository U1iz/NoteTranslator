window.path_info = {
    dictionary: './data/dictionary.json',
    result: './data/result.json',
    history: './data/history.json'
}
start()

function start() {
    new Promise(resolve => {
            let dic, result;
            // 判断文件是否存在
            window.action.exist(path_info.dictionary)
                .then(res => {
                    dic = res
                    window.action.exist(path_info.result)
                        .then(res => {
                            result = res
                            resolve([dic, result])
                        })
                })
            window.action.createFile(path_info.history)
            window.action.exist(path_info.history)
                .then(res => {
                    !res ? window.action.createFile(path_info.history) : null;
                })
        })
        .then(res => {
            // console.log(res);
            init(res)
            if (res[0] && res[1]) {
                /**
                 * 如果 dictionary.json 不存在
                 * 则说明用户第一次打开或已清空
                 * 这也代表 result.json 内也没有数据
                 */
                /**
                 * 当 result.json 存在
                 * 则校验
                 */

            }
        })
}

function init(fileState) {
    // 判断字典文件是否存在
    if (fileState[0]) {
        // 字典文件存在
        // 读取字典内容
        window.action.readFile({
                path: 'data',
                file: 'dictionary.json',
            })
            .then(res => {
                const dic_data = isJSON(res);
                if (res.length && dic_data) {
                    // 字典文件内容为json格式
                    // 判断结果文件内容是否存在
                    if (fileState[1]) {
                        // 文件存在
                        window.action.readFile({
                                path: 'data',
                                file: 'result.json',
                            })
                            .then(res => {
                                const res_data = isJSON(res);
                                if (res.length && res_data) {
                                    // 结果文件内容为json格式
                                    // 校验数据
                                    checkData(dic_data, res_data)
                                } else {
                                    // 结果文件内容为空 && 非json格式
                                    create_result(dic_data)
                                }
                            })
                    } else {
                        // 文件不存在
                        create_result(dic_data)
                    }

                } else {
                    // 字典文件内容为空，非json格式
                    // 该模块结束
                }
            })
    } else {
        // 字典文件不存在
        // 生成字典文件，内容为空
        // 创建结果文件，这里不会覆写
        createFile()
    }
}


function create_result(data) {
    // 当 校验不通过 & result数据异常 时爬取数据
    return new Promise(resolve => {
        translator(data)
            .then(res => {
                window.transForm = res;
                const opinion = {
                    path: 'data',
                    file: 'result.json',
                    flag: 'w',
                    content: JSON.stringify(res)
                }

                let temp = {};
                for (let k in res) {
                    temp[k] = Object.keys(res[k])
                }
                delete temp.ps

                window.action.writeFile(opinion)
                    .then(dir => {
                        // start()
                        resolve(dir)
                    })
            })
    })
}

function createFile() {
    // 如果文件不存在则创建，存在则不执行
    window.action.createFile([
        path_info.dictionary,
        path_info.result
    ])
}

function checkData(dic_data, res_data) {
    // 临时变量temp，用于装载result中的所有字段名
    let temp = {};
    for (let k in res_data) {
        temp[k] = Object.keys(res_data[k])
    }
    delete temp.ps
    console.log(dic_data);
    console.log(temp);

    new Promise(resolve => {
            // 校验已有的文件是否已包含所有所需条目
            window.action.hash([
                    JSON.stringify(dic_data),
                    JSON.stringify(temp),
                ])
                .then(res => {
                    if (res[0] == res[1]) {
                        window.transForm = res_data;
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
        })
        .then(res => {
            // 如果 result.json 字段与 dic 不同，重新写入
            if (!res) create_result(dic_data).then(res => console.log(res))
            console.log(res);
        })
}