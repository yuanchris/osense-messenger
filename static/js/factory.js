let currentClient = {name: null } // 當前客戶
let factory_id = $('#factory_id').text();
let mesList = {}


$(document).ready(async function () {
    const msg_history = await fetch(`/get_history_msg?clientOrFactory=factory&name=${factory_id}`,
    {method:'GET'}).then((res) => res.json());

    if (msg_history !== 'Not found' &  Object.keys(msg_history).length !== 0){
        mesList = msg_history;
        for (let name in mesList){
            if (mesList[name].noread == 'true') {
                $('.client-ul').append(`<li class="client-li noread"  data-name='${name}'><span class="ball"></span>${name}</li>`)
            } else {
                $('.client-ul').append(`<li class="client-li"  data-name='${name}'><span class="ball"></span>${name}</li>`)
            }
        }
    } else {console.log('no history')}

    const iosocketServe = io.connect();
    iosocketServe.on('connect', function () {

        iosocketServe.emit('join', {class:'factory', room: factory_id, username: factory_id});

        iosocketServe.on(`${factory_id}`, function (msg) {
            updateRoomView('client', msg, msg.from);
        })
        iosocketServe.on(`client_in`, function (msg) {
            console.log('client in');
            $(`li[data-name='${msg['username']}'] span`).addClass('green')

        })
        iosocketServe.on(`client_out`, function (msg) {
            $(`li[data-name='${msg['username']}'] span`).removeClass('green')

        })

        iosocketServe.on(`${factory_id}_online`, function (online_client) {
            console.log('online_client:', online_client);
            for (let i in online_client) {
                $(`li[data-name='${online_client[i]}'] span`).addClass('green')
            }            
        })
        $(window).on('beforeunload', function() {
            iosocketServe.emit('send_disconnect', {class:'factory', room: factory_id, username: factory_id})
          });
    
    })
    $('.btn-blue').click(function () {
        if (currentClient.name!=null) {
            var text = $(".mesbox").val();
            if (text != "") {
                var data = {
                    from: factory_id,
                    name: currentClient['name'],
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                }
                iosocketServe.emit('msgFromFactory', data);
                $('.mesbox').val('');
                updateRoomView(data['from'], data, currentClient.name);
            }
        } else {
            alert('please select a client')
        }
    })
    $('.client-ul').click(changeCurrentClient)
})

function updateRoomView(type, msg, fromName) { // 收到訊息 更改視窗
    addMsg(msg, fromName)
    if (type == factory_id) { // 客服消息
        var html = "";
        html += '<div class="msg-item row send">' +
        '<div class="col">' +
        `<div class="name">${factory_id}</div>` +
        '<div class="row mesinfo">' +
        `<div class="time">${msg.time.split(' ')[1]}</div>`+
        '<div class="msg">' + msg.content + '</div>' +

        '<div class="jiao-right"></div>' +
        '</div>' +
        '</div>' +
        '<img src="/static/img/factory.jpg" class="avatar" />' +
        '</div>';
        $(".room").append(html);
        $('.room').scrollTop($('.room')[0].scrollHeight);
    }
    else if (type == 'client' && currentClient.name == fromName) { // 客户消息
        var html = "";
        html += `<div class="msg-item row recive">
                <img src="/static/img/msn.png" class="avatar" />
                <div class="col">
                    <div class="name">${fromName}</div>
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


function addMsg(msg, clientName) { // 儲存到mesList 若不是當前使用者，顯示橘色
    if (!mesList[clientName]) {
        mesList[clientName] = {
          list: [],
          noread: "false"
        }
        $('.client-ul').append(`<li class="client-li"  data-name='${clientName}'><span class="ball green"></span>${clientName}</li>`)
      }
    
    let noread = "false"
    if (clientName != currentClient.name) {
        noread = "true"
        let arr = $('.client-li')
        for(let i = 0; i < arr.length; i++) { // add noread signal
            let name = $(arr[i]).attr('data-name')
            if(name == clientName) {
                $(arr[i]).addClass('noread')
            }
        }
    }
    mesList[clientName].list.push(msg)
    mesList[clientName].noread = noread
}
function resizeRoomView() { // 切換對話者時 更改對談內容
    let html = ''
    let list = mesList[currentClient.name].list
    if(!list) {
        console.log('no list')
        return
    }    
    for (let i = 0; i < list.length; i++) {
        html += getMsgHtml(list[i], currentClient.name)
    }
    $('.room').html(html)
    $('.room').scrollTop($('.room')[0].scrollHeight);
}
function getMsgHtml(msg, name) { // 切換客戶
    if (msg.from == factory_id) {
        return `<div class="msg-item row send">
                <div class="col">
                    <div class="name">${factory_id}</div>
                    <div class="row mesinfo">
                    <div class="time">${msg.time.split(' ')[1]}</div>
                    <div class="msg">${msg.content}</div>

                    <div class="jiao-right"></div>
                    </div>
                </div>
                <img src="/static/img/factory.jpg" class="avatar" />
                </div>`
    }   
    else {
        return `<div class="msg-item row recive">
                <img src="/static/img/msn.png" class="avatar" />
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
    
}


function changeCurrentClient(e) {
    let event = e || window.event
    let target = event.target || event.srcElement
    let name = $(target).attr('data-name')
    currentClient = {
        name: name,
    }
    $('.client-li').removeClass('active')
    $(target).addClass('active')
    $(target).removeClass('noread')
    $('#client_window_name').text(name);
    resizeRoomView()
    console.log(mesList)
    if (mesList[name]['noread'] == 'true') {
        const iosocketServe = io.connect();
        iosocketServe.emit('read_msg_fromFactory', factory_id, name); 
        mesList[name]['noread'] = 'false';
    }
}


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