let current_factory = {name: null } // 選到的廠商
let userName = $('#userName').text(); // your name
let mesList = {}
let factory_list = []

$(document).ready(async function () {
    const get_factory_list =  await fetch(`/get_factory_list`,
    {method:'GET'}).then((res) => res.json());
    factory_list = get_factory_list;

    const msg_history = await fetch(`/get_history_msg?clientOrFactory=client&name=${userName}`,
    {method:'GET'}).then((res) => res.json());
    console.log('msg_history', msg_history)
    if (msg_history !== 'Not found' &  Object.keys(msg_history).length !== 0){
        mesList = msg_history;
    } else {console.log('no history')}
    
    for (let i in factory_list) {
        if (!mesList[factory_list[i]]) {
            mesList[factory_list[i]] = {
              list: [],
              noread: "false"
            }
          }

        if (mesList[factory_list[i]].noread == 'true') {
            $('.client-ul').append(`<li class="client-li noread"  data-name='${factory_list[i]}'><span class="ball"></span>${factory_list[i]}</li>`)
        } else {
            $('.client-ul').append(`<li class="client-li"  data-name='${factory_list[i]}'><span class="ball"></span>${factory_list[i]}</li>`)
        }  
    }

    const iosocketServe = io.connect();
    iosocketServe.on('connect', function () {
        iosocketServe.emit('join', {class:'client', username: userName});

        iosocketServe.on(`${userName}`, function (msg) {
            updateRoomView('other', msg, msg.from);
        });
        iosocketServe.on(`factory_in`, function (msg) {
            $(`li[data-name='${msg['username']}'] span`).addClass('green')

        })
        iosocketServe.on(`factory_out`, function (msg) {
            $(`li[data-name='${msg['username']}'] span`).removeClass('green')
            console.log('factory_out')
        })

        iosocketServe.on(`${userName}_online`, function (online_factory) {
            console.log('online_factory:', online_factory);
            for (let i in online_factory) {
                $(`li[data-name='${online_factory[i]}'] span`).addClass('green')
            }
        })
        $(window).on('beforeunload', function() {
            iosocketServe.emit('send_disconnect', {class:'client', username: userName})
          });

    })
    $('.btn-blue').click(function () {
        if (current_factory.name!=null) {
            let text = $(".mesbox").val();
            if (text != "") {
                let data = {
                    from: userName,
                    name: current_factory['name'],
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                }
                iosocketServe.emit('msgFromClient', data);
                $('.mesbox').val('');
                updateRoomView(userName, data, current_factory.name);
            }
        } else {
            alert('please select a client')
        }
    })
    $('.client-ul').click(changeCurrent_factory)
})

function updateRoomView(type, msg, fromName) { // 收到訊息 更改視窗
    addMsg(msg, fromName)
    if (type == userName) { // 客戶自己發的
        var html = "";
        html += '<div class="msg-item row send">' +
        '<div class="col">' +
        `<div class="name">${userName}</div>` +
        '<div class="row mesinfo">' +
        `<div class="time">${msg.time.split(' ')[1]}</div>`+
        '<div class="msg">' + msg.content + '</div>' +

        '<div class="jiao-right"></div>' +
        '</div>' +
        '</div>' +
        '<img src="/static/img/msn.png" class="avatar" />' +
        '</div>';
        $(".room").append(html);
        $('.room').scrollTop($('.room')[0].scrollHeight);
    }
    else if (type == 'other' && current_factory.name == fromName) {
        var html = "";
        html += `<div class="msg-item row recive">
                <img src="/static/img/factory.jpg" class="avatar" />
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

    
    let noread = "false"
    if (clientName != current_factory.name) {
        noread = "true"
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
    let list = mesList[current_factory.name].list
    if(!list) return
    for (let i = 0; i < list.length; i++) {
        html += getMsgHtml(list[i], current_factory.name)
    }
    $('.room').html(html)
    $('.room').scrollTop($('.room')[0].scrollHeight);
}
function getMsgHtml(msg, name) { // 切換客戶
    if (msg.from == userName) {
        return `<div class="msg-item row send">
                    <div class="col">
                        <div class="name">${userName}</div>
                        <div class="row mesinfo">
                            <div class="time">${msg.time.split(' ')[1]}</div>
                            <div class="msg">${msg.content}</div>
                            <div class="jiao-right"></div>
                        </div>
                    </div>
                    <img src="/static/img/msn.png" class="avatar" />
                </div>`
    }
    else {
        return `<div class="msg-item row recive">
                    <img src="/static/img/factory.jpg" class="avatar" />
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


function changeCurrent_factory(e) {
    let event = e || window.event
    let target = event.target || event.srcElement
    let name = $(target).attr('data-name')
    current_factory = {
        name: name,
    }
    $('.client-li').removeClass('active')
    $(target).addClass('active')
    $(target).removeClass('noread')
    $('#factory_window_name').text(name);
    resizeRoomView()
    console.log(mesList)
    if (mesList[name]['noread'] == 'true') {
        const iosocketServe = io.connect();
        iosocketServe.emit('read_msg_fromClient', userName, name); 
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