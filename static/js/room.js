$(function () {

    // ---------创建连接-----------
    let socket = io();
    // ----------设置昵称-------------
    let userName = $('#userName').text();
    let roomId = $('#roomId').text();
    console.log('username, roomId:', userName, roomId);
    // 加入房间
    socket.on('connect', function () {
        socket.emit('join', {room: roomId, username: userName});
    });
    //暱稱重複
    socket.on('loginFail', function () {
        alert('重複登入聊天室');
        window.close();
    });
    // 監聽消息
    socket.on('msg', function (userName, msg, create_time) {
        // console.log('get message')
        var message = '' +
            '<div class="message">' +
            '  <span class="user">' + userName + ': </span>' +
            '  <span class="msg">' + msg + '</span>' +
            '  <span class="time">' + create_time + '</span>' +
            '</div>';
        $('#msglog').append(message);
        // 滾動條保持最下方
        $('#msglog').scrollTop($('#msglog')[0].scrollHeight);  
    });

    // 監聽系統消息
    socket.on('sys', function (sysMsg, users) {
        var message = '<div class="sysMsg">' + sysMsg + '</div>';
        $('#msglog').append(message);
        if (users) {
        $('#count').text(users.length);
        $('#users').text(users);
        }

    });
    // 发送消息
    $('#messageInput').keydown(function (e) {
        if (e.which === 13) {
        e.preventDefault();
        var msg = $(this).val();
        $(this).val('');
        data = {msg: msg, roomID: roomId};
        socket.emit('send_message', data);
        }
    });
    $(window).on('beforeunload', function() {
        socket.emit('get_disconnect', roomId)
      });

});

function back() {
    window.location.href = '/roomlist';
  }