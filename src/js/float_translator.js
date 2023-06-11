window.addEventListener('load', () => {
    if (!$('#menu-translator').length) {
        $('body').append('<div id="menu-translator"></div>')
    }
    // 浮动翻译模块
    let selection_timer, event;
    document.addEventListener("mouseup", _event => {
        clearTimeout(selection_timer)
        // 用户鼠标抬起0.5秒内无操作，则获取选中文字
        selection_timer = setTimeout(() => {
            // 判断是否处在翻译菜单
            if (!$(_event.target).closest("#menu-translator").length) {
                float_translator();
                event = _event;
            }
        }, 500)
    })

    function float_translator() {
        // 获取选中文本
        const selection = window.getSelection().toString().trim();
        // 根据选中文本获取翻译文本
        if (selection.length > 1) {
            transAjax(selection)
                .then(res => float_translator_data(res))
        }
    }

    function float_translator_data(res) {
        // 获取到当前元素的所有位置信息
        const rect = event.target.getBoundingClientRect()
        // 进一步解析翻译对象
        handle_translate_data(res)
            .then(data => {
                editMenu(data)
            })

        // 设置翻译窗口的位置
        $('#menu-translator').css({
            top: rect.bottom + 'px',
            left: rect.left + 'px'
        })
    }

    function editMenu(data) {
        // 显示翻译块，清空内容
        $('#menu-translator').show().html('')
        // 获取到翻译对象的类型，后续可以扩展
        switch (data.type) {
            case 'baidu-word':
                transMenu_block(data.src)
                data.desc.forEach(e => {
                    $('#menu-mean').append(`<td>${e.pre}</td>`)
                    let td = $('<td><ul></ul></td>')
                    e.mean.forEach(m => {
                        td.children('ul').append(`<li>${m}</li>`)
                    })
                    $('#menu-mean').append(td)
                })

                break;
            case 'baidu-sentence':
                transMenu_block(data.desc[0].src)
                $('#menu-mean tr').append(
                    `<td>${data.desc[0].mean}</td>`)
                break;

            default:
                break;
        }

        // 赋予用户移动窗口的能力
        dragElem({
            drag: $('#transMenu_drag')[0], // 拖动手柄的选择器
            menu: $('#menu-translator')[0], // 菜单的选择器
            body: window, // 父元素的选择器
            boundary: 10,
        });
    }

    function transMenu_block(val) {
        $('#menu-translator')
            .append(`
        <div id="transMenu_drag"><span class="menu_close_btn">x</span></div>
        <div id="transMenu_title">
            <h3>${val}</h3>
            <aside>
                <span>记录为</span>
                
                <select>
                    <option value="word">单词</option>
                    <option value="phrase">词组</option>
                    <option value="sentence">句子</option>
                </select>
                <button>记录</button>
            </aside>
        </div>
        <table id="menu-mean"><tbody><tr></tr></tbody></table>`)
        $('#menu-translator span').first().on('click', () => {
            $('#menu-translator').hide()
        })


        window.action.readFile('./data/dictionary.json')
            .then(res => {
                res = isJSON(res)
                if (res) {
                    $('#transMenu_title aside').css('opacity', 1)
                    $('#transMenu_title aside button').on(
                        'click', () => {
                            let key = $('#transMenu_title aside select').val()
                            let val = $('#transMenu_title h3').text();
                            res[key].push(val)
                            res[key] = Array.from(new Set(res[key]))
                            window.action.writeFile({
                                    path: 'data',
                                    file: 'dictionary.json',
                                    flag: 'w',
                                    content: JSON.stringify(res)
                                })
                                .then(res => {
                                    $('#transMenu_title aside').css('opacity', 0)
                                    // 同步结果
                                    init([1, 1])
                                })
                        })
                }
            })
    }
})