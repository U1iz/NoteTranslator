/**
 * fs基本文件操作封装 version 0.0.2
 */

const fs = require('fs');
const _path = require('path')

// 文件操作
function catchErr(err, [msg, resolve, reject, success, failed]) {
    // console.log(arguments);
    return err ? (() => {
        // 失败
        failed ? console.error('failed') : null;
        reject(err, msg, failed);
        return false;
    })() : (() => {
        // 成功
        success ? console.log('success') : null;
        resolve(msg, success);
        return true;
    })();
}

function LegalStr(solve, str) {
    /**
     * 字符合法化
     * @param {boolean} solve 是否处理
     * @param {string} str 目录、文件名
     */
    // 如果在Windows系统下，替换掉路径中的无效字符: process.platform === 'win32'
    if (solve) return str.replace(/[<>:"/\\|?*]+/g, '');
    return str;
}
const fileOperator = {
    createFolder: ({
        path,
        sync,
        Legal
    }) => {
        /**
         * * 创建文件夹，可一次性创建多层
         * @param {string} path 需要创建的文件夹名称
         * @param {boolean} sync 是否异步执行
         * @param {boolean} Legal 是否合法化字符串（往后不再赘述）
         */
        const dir = `${__dirname}/${LegalStr(Legal, path)}`,
            opinion = {
                recursive: true
            };
        return new Promise((resolve, reject) => {
            const paramSet = [dir, resolve, reject, '已成功创建文件夹', '文件夹创建失败'];
            if (!fs.existsSync(dir)) {
                if (sync) {
                    // 同步
                    let error;
                    try {
                        fs.mkdirSync(dir, opinion);
                    } catch (err) {
                        error = err;
                    } finally {
                        catchErr(error, paramSet)
                    }
                } else {
                    // 异步
                    fs.mkdir(dir, opinion, err => catchErr(err, paramSet));
                }
            } else {
                console.log('文件夹已存在');
                resolve(dir);
            }
        })
    },
    deleteFolder: ({
        path,
        sync,
        Legal
    }) => {
        /**
         * * 删除文件夹，一次只能删除最末尾的目录
         * ! 删除文件夹需要先清空文件夹
         * @param {string} path 需要删除的文件夹名称
         * @param {boolean} sync 是否异步执行
         */

        const dir = `${__dirname}/${LegalStr(Legal, path)}`
        return new Promise((resolve, reject) => {
            const paramSet = [dir, resolve, reject, '已成功删除文件夹', '文件夹删除失败'];
            if (sync) {
                let error;
                try {
                    // 同步
                    fs.rmdirSync(dir)
                } catch (err) {
                    error = err;
                } finally {
                    catchErr(error, paramSet)
                }
            } else {
                // 异步
                fs.rmdir(dir, err => catchErr(err, paramSet))
            }
        })
    },
    createFile: ({
        path = '',
        file = 'none.txt',
        content = '文件内容',
        flag = 'a',
        sync,
        Legal
    } = {}) => {
        /**
         * * 将内容写入文件中。如果文件不存在，会自动创建文件。
         * ! 仅能创建文件，不能自动创建目录
         * @param {string} path_file 需要创建的文件路径
         * @param {string} content 需要写入的文件内容，必须是字符串类型
         * @param {string} flag 写入方式（a：追加写入；w：覆盖写入）
         */
        const opt = {
            flag: flag
        }

        const dir = _path.join(__dirname, '../', path, LegalStr(Legal, file))

        return new Promise((resolve, reject) => {
            const paramSet = [dir, resolve, reject, '数据写入成功', '数据写入失败'];
            if (sync) {
                // 同步
                const fd = fs.openSync(dir, flag)
                let error;
                try {
                    fs.writeFileSync(fd, content, opt)
                } catch (err) {
                    error = err;
                } finally {
                    catchErr(error, paramSet)
                    fs.closeSync(fd)
                }
            } else {
                // 异步
                fs.open(dir, flag, (err, fd) => {
                    if (err) {
                        reject(err, dir, '文件打开失败')
                    } else {
                        fs.writeFile(fd, content, opt, err => {
                            fs.close(fd);
                            catchErr(err, paramSet)
                        })
                    }
                })
            }
        })
    },
    deleteFile: ({
        path = '',
        file = 'none.txt',
        sync,
        Legal
    } = {}) => {
        /**
         * * 删除文件
         * @param {string} file 需要创建的文件路径
         * @param {boolean} sync 是否同步
         */
        const dir = _path.join(__dirname, '../', path, LegalStr(Legal, file))
        return new Promise((resolve, reject) => {
            const paramSet = [dir, resolve, reject, '成功删除文件', '删除文件失败'];
            if (sync) {
                // 同步
                let error;
                try {
                    fs.unlinkSync(dir);
                } catch (err) {
                    error = err;
                } finally {
                    catchErr(error, paramSet)
                }
            } else {
                // 异步
                fs.unlink(dir, err => {
                    catchErr(err, paramSet)
                })
            }
        })
    },
    readFile: ({
        path = '',
        file = 'none.txt',
        sync,
        Legal
    } = {}) => {
        /**
         * @param {string} file 需要读取的文件路径
         */
        const dir = _path.join(__dirname, '../', path, LegalStr(Legal, file))
        return new Promise((resolve, reject) => {
            if (sync) {
                // 同步
                let error, data;
                try {
                    data = fs.readFileSync(dir);
                } catch (err) {
                    error = err;
                } finally {
                    if (error) {
                        reject(err, dir, '文件读取失败')
                        return;
                    }
                    // data 是二进制类型，需要转换成字符串
                    resolve(data, '文件读取成功')
                }
            } else {
                // 异步
                fs.readFile(dir, (err, data) => {
                    if (err) {
                        reject(err, dir, '文件读取失败')
                        return;
                    }
                    // data 是二进制类型，需要转换成字符串
                    resolve(data.toString(), '文件读取成功')
                })
            }
        })
    }
}
// 通用指令
const opinion = {
    path: 'test',
    sync: true,
    legal: false,

    file: 'test.txt',
    content: '文本内容'
}

module.exports.opt = fileOperator;
module.exports.dft = opinion;