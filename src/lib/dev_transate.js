function query(opn) {
    var appid = '';
    var key = '';
    var salt = (new Date).getTime();

    const opinion = {
        ...{
            q: '',
            appid: appid,
            salt: salt,
            from: 'en',
            to: 'zh'
        },
        ...opn
    }

    opinion.sign = MD5(appid + opinion.q + salt + key)
    const queryString = new URLSearchParams(opinion).toString()

    return new Promise(resolve => {
        fetch('http://api.fanyi.baidu.com/api/trans/vip/translate?' + queryString)
            .then(res => res.json())
            .then(data => resolve(data))
    })
}