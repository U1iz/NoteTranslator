/**
 * * 深拷贝对象
 * @param {Object} 需要拷贝的对象
 * @returns 与需要拷贝对象完全一致的新的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let clone = Array.isArray(obj) ? [] : {};

    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clone[key] = deepClone(obj[key]);
        }
    }

    return clone;
}

function handle_translate_data(json) {
    let result = {
        desc: []
    }

    return new Promise(resolve => {
        if (json.result) {
            // 单词
            result.type = 'baidu-word'
            let open = JSON.parse(json.result)
            result.desc = open.content[0].mean
            result.desc.forEach((elem, i) => {
                result.desc[i] = {
                    pre: elem.pre,
                    mean: Object.keys(elem.cont)
                }
            });
            getAudio(open.src)
                .then(res => {
                    result.src = open.src
                    result.audio = res;
                    resolve(result);
                })
        } else {
            // 词句
            result.type = 'baidu-sentence'
            json.data.forEach((elem, i) => {
                result.desc[i] = {
                    mean: elem.dst,
                    src: elem.src
                }
                getAudio(elem.src)
                    .then(res => {
                        result.desc[i].audio = res
                        resolve(result);
                    })
            })
        }
    })
}

/* dragElem({
    drag: '#drag', // 拖动手柄的选择器
    menu: '#menu', // 菜单的选择器
    body: '#body', // 父元素的选择器
    boundary: '20',
    leftBoundary: 20, // 父元素左侧边界距离浏览器边界的距离
    topBoundary: 20, // 父元素顶部边界距离浏览器边界的距离
    rightBoundary: 20, // 父元素右侧边界距离浏览器边界的距离
    bottomBoundary: 20, // 父元素底部边界距离浏览器边界的距离
    allowOverflow: false // 是否允许超出浏览器边界
}); */


/* dragElem({
    drag: $('#drag')[0], // 拖动手柄的选择器
    menu: $('#menu')[0], // 菜单的选择器
    body: window, // 父元素的选择器
    boundary: 10,
}); */

function dragElem(options) {
    let dragDom = options.drag;
    let menuDom = options.menu;
    let bodyDom = options.body;
    let allowOverflow = options.allowOverflow || false; // 是否允许超出浏览器边界
    let boundary = {
        left: 0,
        top: 0,
        right: bodyDom.innerWidth - menuDom.offsetWidth,
        bottom: bodyDom.innerHeight - menuDom.offsetHeight
    } // 父元素拖动的边界

    window.addEventListener('resize', boundarySize)
    boundarySize()

    function boundarySize() {
        if (Array.isArray(options.boundary)) {
            switch (options.boundary.length) {
                case 1:
                    boundary = {
                        left: 0,
                        top: 0,
                        right: bodyDom.innerWidth - menuDom.offsetWidth,
                        bottom: bodyDom.innerHeight - menuDom.offsetHeight
                    }
                    break
                case 2:
                    boundary = {
                        left: options.boundary[1],
                        top: options.boundary[0],
                        right: bodyDom.innerWidth - (menuDom.offsetWidth + options.boundary[1]),
                        bottom: bodyDom.innerHeight - (menuDom.offsetHeight + options.boundary[0])
                    }
                    break;
                case 3:
                    boundary = {
                        left: options.boundary[1],
                        top: options.boundary[0],
                        right: bodyDom.innerWidth - (menuDom.offsetWidth + options.boundary[1]),
                        bottom: bodyDom.innerHeight - (menuDom.offsetHeight + options.boundary[2])
                    }
                    break;
                case 4:
                    boundary = {
                        left: options.boundary[0],
                        top: options.boundary[1],
                        right: bodyDom.innerWidth - (menuDom.offsetWidth + options.boundary[2]),
                        bottom: bodyDom.innerHeight - (menuDom.offsetHeight + options.boundary[3])
                    }
                    break;
            }
        } else {
            boundary = {
                left: options.boundary,
                top: options.boundary,
                right: bodyDom.innerWidth - (menuDom.offsetWidth + options.boundary),
                bottom: bodyDom.innerHeight - (menuDom.offsetHeight + options.boundary)
            }
        }
    }

    dragDom.addEventListener('mousedown', function (e) {
        $(document.body).addClass('drag')
        let pos = {
            x: e.clientX,
            y: e.clientY
        };
        let offset = {
            left: menuDom.offsetLeft,
            top: menuDom.offsetTop
        };

        function onMouseMove(e) {
            let x = e.clientX - pos.x;
            let y = e.clientY - pos.y;
            let left = offset.left + x;
            let top = offset.top + y;

            if (!allowOverflow) {
                if (left < boundary.left) left = boundary.left;
                if (top < boundary.top) top = boundary.top;
                if (left > boundary.right) left = boundary.right;
                if (top > boundary.bottom) top = boundary.bottom;
            }

            menuDom.style.left = left + 'px';
            menuDom.style.top = top + 'px';
        }

        function onMouseUp() {
            $(document.body).removeClass('drag')
            // window.getSelection().deleteFromDocument()
            window.getSelection().empty();

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function isJSON(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}

function writeFile(opinion) {
    window.action.createFile(opinion.filePath)
        .then(() => {
            window.action.readFile(opinion.filePath)
                .then(res => {
                    if (!opinion.isJSON || (opinion.isJson && isJSON(res))) {
                        window.action.writeFile(opinion)
                    }
                })
        })
}

/* function dic_res_sync(dic_opinion, call_1, call_2) {
    window.action.writeFile(dic_opinion)
        .then(res => {
            call_1 && call_1()
            // 更新result文件
            let temp = isJSON(res)
            if (temp) {
                translator(temp).then(res_data => {
                    window.action.writeFile({
                            path: 'data',
                            file: 'result.json',
                            flag: 'w',
                            content: JSON.stringify(res_data)
                        })
                        .then(res => {
                            call_2 && call_2()
                            console.log(res)
                        })
                })
            }
        })
} */


function createWindow(url, target) {
    // 通过主进程创建新窗口
    window.electronAPI.createWindow({
        webFile: url,
        // target: target,
        needed: true
    })
}