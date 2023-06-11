const {
    // 浏览器窗口
    BrowserWindow,
    // 主进程
    app,
    Menu,
    ipcMain,
    remote,
    session,
    shell
} = require('electron')
const path = require('path')
const ipc_fn = require('./main_ipc_fn')
// {
// 获取所有交互数据
//     const {
//         app,
//         session
//     } = require('electron')

//     app.on('ready', () => {
//         const filter = {
//             urls: ['*://*/*']
//         }

//         const requestListener = (details, callback) => {
//             console.log(details)
//             callback({
//                 cancel: false
//             })
//         }

//         session.defaultSession.webRequest.onBeforeRequest(filter, requestListener)
//     })

// }
// ipc_fn.electronAPI.clearData()
// 监听表
const listener = {
    module_reference: 'ipc_fn',
    fn_reference: {
        electronAPI: [{
                fn: 'setTitle',
                id: 'set-title',
                use: ['on', 'title'],
                void: true
            },
            {
                fn: 'clearData',
                id: 'storage-clear',
                use: ['on', 'mode'],
                void: true
            },
            /* {
                fn: 'createWindow',
                id: 'create-window',
                use: ['on', 'opinion']
            } */
        ],
        action: [{
                fn: 'writeFile',
                id: 'file-writeIn',
                use: ['handle', 'opinion']
            },
            {
                fn: 'createFile',
                id: 'fse-create',
                use: ['handle', 'path']
            },
            {
                fn: 'readFile',
                id: 'file-read',
                use: ['handle', 'opinion']
            },
            {
                fn: 'exist',
                id: 'file-exist',
                use: ['handle', 'path']
            },
            {
                fn: 'deleteFolder',
                id: 'fse-delete-folder',
                use: ['handle', 'pathSet']
            },
            {
                fn: 'hash',
                id: 'hash-encode',
                use: ['handle', 'obj, hashType']
            },
        ],
        extraAPI: [{
                fn: 'natural',
                id: 'module-natural',
                use: ['handle', 'str']
            },
            {
                fn: 'fixCase',
                id: 'module-change-case',
                use: ['handle', 'strSet']
            },
            {
                fn: 'isWord',
                id: 'module-natural-WordTokenizer',
                use: ['handle', 'str']
            },
        ]
    }
}

const scriptSet = [
    'https://cdn.bootcss.com/jquery/3.6.0/jquery.min.js',
    'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/js/init.js',
    'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/js/fn.js',
    'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/js/float_translator.js',
    'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/js/translate.js'
]

const cssSet = [
    'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/css/float_translator.css'
]

function createWindow({
    on = {
        'did-finish-load': () => {
            win.webContents.executeJavaScript(`console.log('Hello from injected JavaScript!')`)
        }
    },
    webFile = 'index.html',
    needed = true
} = {}) {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    })

    win.webContents.on('new-window', (event, url) => {
        // 在这里处理打开新窗口的事件，例如打印一条消息。
        console.log('页面打开:', url);
    });

    win.loadFile(path.join(__dirname, webFile))
    // win.webContents.openDevTools(); // 以上次打开的状态打开开发工具

    // 注册事件
    for (let k in listener.fn_reference) {
        let path = `${listener.module_reference}.${k}`;
        listener.fn_reference[k].forEach(elem => {
            let param = Array.isArray(elem.use) ? ', ' + elem.use[1] : '';
            let use = param.length ? elem.use[0] : elem.use

            param = 'event' + param
            let shell = `ipcMain.${use}('${elem.id}', (${param}) => {`
            let call =
                `${elem.void ? '' : 'return'}` +
                ` ${elem.await ? 'await' : ''}` +
                ` ${path}.${elem.fn}(${param})`
            let exit = '})'
            try {
                eval(`${shell}${call}${exit}`);
            } catch (err) {
                win.webContents.executeJavaScript(`console.warn(${err})`)
            }
        })
    }

    // 监听打开新页
    win.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        listen_winCreate(event, url, frameName, disposition, options)
    })

    // 在主进程中监听HTML页面载入新页面
    app.on('web-contents-created', (event, contents) => {
        // 监听渲染进程有新页面打开
        contents.on('did-navigate', (event, url) => {
            // 向新页面的控制台打印“Hello World”
            contents.executeJavaScript(`console.log('Hello World');`)
                .then(() => {
                    // 将本地的js初始化脚本文件转为字符串
                    const filePath = 'https://gitee.com/u1iz/Electron-localTranslator-lib/raw/master/src/js/init.js';

                    targetWin.webContents.executeJavaScript(`console.log(${filePath})`)
                })
        });
    });

}

function listen_winCreate(event, url, frameName, disposition, options) {
    // 取消默认行为（不打开新窗口）
    event.preventDefault()

    // 创建一个新的 BrowserWindow 来载入目标网站
    const targetWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // 禁止在渲染进程调用node
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),

        }
    })
    targetWin.loadURL(url)

    // 监听窗口加载完毕事件
    targetWin.webContents.once('did-finish-load', () => {
        // 创建新窗口时，为其Web内容注册事件监听器。
        // 在新页面中注入 JavaScript 脚本
        // const scriptCode = `alert('Hello World!')`
        // targetWin.webContents.executeJavaScript(scriptCode)
        scriptSet.forEach(e => {
            // e = path.join(__dirname, e)
            targetWin.webContents.executeJavaScript(`;{
                    let scriptNode = document.createElement('script')
                    scriptNode.src = "${e}"
                    document.head.appendChild(scriptNode)}
            `)
        })
        cssSet.forEach(e => {
            // e = path.join(__dirname, e)
            targetWin.webContents.executeJavaScript(`;{
                    let styleNode = document.createElement('link')
                    styleNode.href = "${e}"
                    document.head.appendChild(styleNode)}
            `)
        })
    })


    // 监听打开新页
    targetWin.webContents.on('new-window', (event, url, frameName, disposition, options) => {
        listen_winCreate(event, url, frameName, disposition, options)
    })
}

app.whenReady().then(() => {
    /* createWindow({
        webFile: 'translator.html'
    }) */


    // 外部浏览器打开新页面
    /* shell.openExternal('https://www.bilibili.com/').then(() => {
        // 注入脚本
        const scriptCode = `alert('Hello World!')`
        const executeScript = `
      (function() {
        var script = document.createElement('script');
        script.innerHTML = "${scriptCode.replace(/"/g, '\\"')}";
        document.body.appendChild(script);
      })()
    `
        setTimeout(() => {
            // 确保页面已经加载完成后再注入脚本
            const win = electron.remote.getCurrentWindow()
            win.webContents.executeJavaScript(executeScript)
        }, 3000) // 延迟 3 秒以确保页面加载完成
    }) */

    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    ipcMain.on('create-window', (event, opinion) => createWindow(opinion))
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})