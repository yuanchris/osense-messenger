var currentClient = { flag: -1, name: null } // 當前客戶
var mesList = {}
let factory_id = $('#factory_id').text();

function clientIn(client) { // 客戶進入
    let date = formatDate(parseInt(Date.now()), 'yyyy-MM-dd hh:mm:ss')
    if (!mesList[client.name]) {
        mesList[client.name] = {
            list: [],
            'name': client.name,
            flag: client.flag,
            noread: false
        }
        $('.news-ul').append(`<li>${date} ${client.name} 進入網站</li>`)
        $('.client-ul').append(`<li class="client-li" data-flag='${client.flag}' data-name='${client.name}'>${client.name}</li>`)
    } else {
        $('.news-ul').append(`<li>${date} ${client.name} 進入網站</li>`)        
    }
    return
}
function clientOut(client) { // 客戶離開
    let date = formatDate(parseInt(Date.now()), 'yyyy-MM-dd hh:mm:ss')
    $('.news-ul').append(`<li>${date} ${client} 離開網站</li>`)
}


function addMsg(msg, clientName) { // 儲存到mesList 若不是當前使用者，顯示橘色
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
    mesList[clientName].list.push(msg)
    mesList[clientName].noread = noread
    // console.log(mesList)
}
function resizeRoomView() { // 切換對話者時 更改對談內容
    let html = ''
    let list = mesList[currentClient.name].list
    if(!list) return
    for (let i = 0; i < list.length; i++) {
        html += getMsgHtml(list[i], currentClient.name)
    }
    $('.room').html(html)
}
function getMsgHtml(msg, name) { // 切換客戶
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
    if (msg.from == 'factory') {
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

function updateRoomView(type, msg, clientName) { // 收到訊息 更改視窗
    console.log(mesList);
    addMsg(msg, clientName)
    if (type == 'factory') { // 客服消息
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
    else if (type == 'client' && currentClient.name == clientName) { // 客户消息
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

$(document).ready(async function () {
    const iosocketServe = io.connect();
    const msg_history = await fetch(`/get_history_msg?clientOrFactory=factory&factory=${factory_id}`,
    {method:'GET'}).then((res) => res.json())
    console.log(msg_history);
    if (msg_history !== 'Not found'){
        mesList = msg_history;
        for (let name in mesList){
            $('.client-ul').append(`<li class="client-li"  data-name='${name}'>${name}</li>`)
        }
    }


    iosocketServe.on('connect', function () {
        console.log('connect')
        iosocketServe.emit('factoryJoin', factory_id);
        iosocketServe.on('clientInto', function (client) {
            clientIn(client)
        })
        iosocketServe.on('clientLeave', function (client) {
            clientOut(client)
        })
        iosocketServe.on('reciveClientMsg', function (msg) {
            updateRoomView('client', msg, msg.name)
        })
    })
    $('.btn-blue').click(function () {
        if (currentClient) {
            var text = $(".mesbox").val();
            if (text != "") {
                var data = {
                    from: 'factory',
                    name: currentClient['name'],
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                    room: factory_id,
                }
                iosocketServe.emit('msgFromFactory', data);
                $('.mesbox').val('');
                updateRoomView(data['from'], data, currentClient.name);
            }
        }
    })
    $('.client-ul').click(changeCurrentClient)
})
document.onkeydown = function (e) {
    var ev = document.all ? window.event : e;
    if (ev.keyCode == 13) { //enter 
        $(".btn-blue").click();
    }
}

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