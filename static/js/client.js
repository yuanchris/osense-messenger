$(document).ready(function () {

    var iosocket = io.connect();
    let username = $('#userName').text();
    let factory_id = $('#factory_id').text();

    console.log(username)
    iosocket.emit('clientJoin', username, factory_id); // 进入页面
  
    window.onunload = function () {  // 关闭页面
        iosocket.emit('clientOut', username, factory_id)
    }
    $(".btn-blue").click(function () {  // 发送消息
        var text = $(".mesbox").val();
        if (text != "") {
            var data = {
                from: 'client',
                name: username,
                content: text,
                time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                room: factory_id,
            }
            iosocket.emit('msgFromClient', data);
            $('.mesbox').val('');
            sendHtml(username, data);
        }
    });
    $('.close-btn').click(function () {
      $('.chat-panel').css('display', 'none')
    })
    $('.contact').click(function () {
      $('.chat-panel').css('display', 'block')
    })
    $(".mesbox").on("blur",function(){
      window.scroll(0,0);//失焦后强制让页面归位
    });  
    iosocket.on('connect', function () {

      //获取消息
      iosocket.on(username, function (msg) {
        reciveHtml('客服', msg);
      });

    });
    // $('.mesbox').focus(function () {
    //   console.log(document.documentElement.clientHeight)
    //   // alert(document.documentElement.clientHeight)
    //   $('html').height(document.documentElement.clientHeight - 100 + 'px')
    // })
  });
  
  function sendHtml(name, msg) {
    var html = "";
    html += '<div class="msg-item row send">' +
      '<div class="col">' +
      '<div class="name">You</div>' +
      '<div class="row mesinfo">' +
      `<div class="time">${msg.time.split(' ')[1]}</div>` +
      '<div class="msg">' + msg.content + '</div>' +
      '<div class="jiao-right"></div>' +
      '</div>' +
      '</div>' +
      '<img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572927293148&di=e93c4aabed259d8845543f725b85d1b3&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01460b57e4a6fa0000012e7ed75e83.png%401280w_1l_2o_100sh.png" class="avatar" />' +
      '</div>';
    $(".room").append(html);
    $('.room').scrollTop($('.room')[0].scrollHeight);
  }
  
  function stopDefaultKey(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    } else {
      window.event.returnValue = false;
    }
    return false;
  }
  function reciveHtml(name, msg) {
    var html = "";
    html += `<div class="msg-item row recive">
              <img src="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1572953950629&di=06d8eb509480525ed9707e4dda361b54&imgtype=0&src=http%3A%2F%2Fimg2.3png.com%2F720f7b22a939834aca195ca984dcd114a6e2.png" class="avatar" />
              <div class="col">
                <div class="name">在線客服</div>
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
  
  document.onkeydown = function (e) {
    var ev = document.all ? window.event : e;
    if (ev.keyCode == 13) {
      $(".btn-blue").click();
      stopDefaultKey(e)
    }
  }
  
  window.addEventListener('resize', function(){       //监测窗口大小的变化事件
    var hh = window.innerHeight;     //当前可视窗口高度
    console.log(hh)
  })

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