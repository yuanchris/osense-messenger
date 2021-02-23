var currentClient = { flag: -1, name: null } // 当前客户
var clientList = {}


function formatDate(date, formatString) {
/** @formatString 格式化日期 yyyy-MM-dd hh:mm:ss */
    let mydate = new Date(date)
    let dateObj = {
        y: mydate.getFullYear(),
        m: (mydate.getMonth() + 1 < 10)?'0'+(mydate.getMonth() + 1):mydate.getMonth() + 1,
        d: (mydate.getDate() < 10)?'0'+mydate.getDate():mydate.getDate(),
        h: (mydate.getHours() < 10)?'0'+mydate.getHours():mydate.getHours(),
        min: (mydate.getMinutes() < 10)?'0'+mydate.getMinutes():mydate.getMinutes(),
        s: (mydate.getSeconds() < 10)?'0'+mydate.getSeconds():mydate.getSeconds()
    }
    let res = formatString.replace(/yyyy/g, dateObj.y)
    res = res.replace(/MM/g, dateObj.m)
    res = res.replace(/dd/g, dateObj.d)
    res = res.replace(/hh/g, dateObj.h)
    res = res.replace(/mm/g, dateObj.min)
    res = res.replace(/ss/g, dateObj.s)
    return res
}
function getMsgHtml(msg, name) {
    if (msg.from == 'client') {
        return `<div class="msg-item row recive">
                <img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572927293148&di=e93c4aabed259d8845543f725b85d1b3&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01460b57e4a6fa0000012e7ed75e83.png%401280w_1l_2o_100sh.png" class="avatar" />
                <div class="col">
                <div class="name">${name}</div>
                <div class="row mesinfo">
                    <div class="jiao-left"></div>
                    <div class="msg">${msg.content}</div>
                    <div class="time">${msg.time.split(' ')[1]}</div>
                </div>
                </div>
            </div>`
    }
    if (msg.from == 'serve') {
        return `<div class="msg-item row send">
                <div class="col">
                    <div class="name">在線客服</div>
                    <div class="row mesinfo">
                    <div class="time">${msg.time.split(' ')[1]}</div>
                    <div class="msg">${msg.content}</div>

                    <div class="jiao-right"></div>
                    </div>
                </div>
                <img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572953950629&di=06d8eb509480525ed9707e4dda361b54&imgtype=0&src=http%3A%2F%2Fimg2.3png.com%2F720f7b22a939834aca195ca984dcd114a6e2.png" class="avatar" />
                </div>`
    }
    return ''
}
function clientIn(client) { // 用户进入网站
    if (!clientList[client.name]) {
        clientList[client.name] = {
        list: [],
        'name': client.name,
        flag: client.flag,
        noread: false
        }
        let date = formatDate(parseInt(Date.now()), 'yyyy-MM-dd hh:mm:ss')
        $('.news-ul').append(`<li>${date} ${client.name} 進入網站</li>`)
        $('.client-ul').append(`<li class="client-li" data-flag='${client.flag}' data-name='${client.name}'>${client.name}</li>`)
    } else {
        let date = formatDate(parseInt(Date.now()), 'yyyy-MM-dd hh:mm:ss')
        $('.news-ul').append(`<li>${date} ${client.name} 進入網站</li>`)        
    }
    return
}
function clientOut(client) { // 用户离开网站
    let date = formatDate(parseInt(Date.now()), 'yyyy-MM-dd hh:mm:ss')
    $('.news-ul').append(`<li>${date} ${client} 離開網站</li>`)
    
}
function addMsg(msg, clientName) { // 放入消息列表
    let noread = false
    if (clientName != currentClient.name) {
        noread = true
        let arr = $('.client-li')
        for(let i=0; i<arr.length; i++) {
            let name = $(arr[i]).attr('data-name')
            if(name == clientName) {
                $(arr[i]).addClass('noread')
            }
        }
    }
    clientList[clientName].list.push(msg)
    clientList[clientName].noread = noread
    console.log(clientList)
}
function resizeRoomView() { // 重置当前聊天窗视图
    let html = ''
    let list = clientList[currentClient.name].list
    if(!list) return
    for (let i = 0; i < list.length; i++) {
        html += getMsgHtml(list[i], currentClient.name)
    }
    $('.room').html(html)
}
function updateRoomView(type, msg, clientName) { // 更新当前聊天窗视图
    addMsg(msg, clientName)
    if (type == 0) { // 客服消息
        var html = "";
        html += '<div class="msg-item row send">' +
        '<div class="col">' +
        '<div class="name">在線客服</div>' +
        '<div class="row mesinfo">' +
        `<div class="time">${msg.time.split(' ')[1]}</div>`+
        '<div class="msg">' + msg.content + '</div>' +

        '<div class="jiao-right"></div>' +
        '</div>' +
        '</div>' +
        '<img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572953950629&di=06d8eb509480525ed9707e4dda361b54&imgtype=0&src=http%3A%2F%2Fimg2.3png.com%2F720f7b22a939834aca195ca984dcd114a6e2.png" class="avatar" />' +
        '</div>';
        $(".room").append(html);
        $('.room').scrollTop($('.room')[0].scrollHeight);
    }
    else if (type == 1 && currentClient.name == clientName) { // 客户消息
        var html = "";
        html += `<div class="msg-item row recive">
                <img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572927293148&di=e93c4aabed259d8845543f725b85d1b3&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01460b57e4a6fa0000012e7ed75e83.png%401280w_1l_2o_100sh.png" class="avatar" />
                <div class="col">
                    <div class="name">${clientName}</div>
                    <div class="row mesinfo">
                    <div class="jiao-left"></div>
                    <div class="msg">${msg.content}</div>
                    <div class="time">${msg.time.split(' ')[1]}</div>
                    </div>
                </div>
                </div>`
        $(".room").append(html);
        $('.room').scrollTop($('.room')[0].scrollHeight);
    }
    return
}
function changeCurrentClient(e) {
    let event = e || window.event
    let target = event.target || event.srcElement
    let name = $(target).attr('data-name')
    currentClient = {
        name: name,
        flag: $(target).attr('data-flag')
    }
    $('.client-li').removeClass('active')
    $(target).addClass('active')
    $(target).removeClass('noread')
    resizeRoomView()
}

$(document).ready(function () {
    const iosocketServe = io.connect();
        $('.btn-blue').click(function () {
            if (currentClient) {
                var text = $(".mesbox").val();
                if (text != "") {
                    var data = {
                        from: 'serve',
                        to: currentClient,
                        content: text,
                        time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm')
                    }
                    iosocketServe.emit('msgFromServe', data);
                    $('.mesbox').val('');
                    updateRoomView(0, data, currentClient.name);
                }
            }
        })
    iosocketServe.on('connect', function () {
        console.log('connect')
        iosocketServe.on('clientInto', function (client) {
            clientIn(client)
        })
        iosocketServe.on('clientLeave', function (client) {
            clientOut(client)
        })
        iosocketServe.on('reciveClientMsg', function (msg) {
            updateRoomView(1, msg, msg.name)
        })
    })

    $('.client-ul').click(changeCurrentClient)
})
document.onkeydown = function (e) {
    var ev = document.all ? window.event : e;
    if (ev.keyCode == 13) {
        $(".btn-blue").click();
    }
}