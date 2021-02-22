from flask import Flask, render_template
import socket, json
from flask import request, url_for, redirect, flash, abort
from datetime import datetime
import hashlib
from flask_socketio import SocketIO,emit, join_room, leave_room
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user,
)

app = Flask(__name__)
app.secret_key = "finn"
socketio = SocketIO(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

users = {
    "osense": {
        "password": "2c6eccac92d3723c708c7dea066ce7b5c5f37c889a6227b6fc7266581542ba7f"
    },
    "chris": {
        "password": "2c6eccac92d3723c708c7dea066ce7b5c5f37c889a6227b6fc7266581542ba7f"
    },
    "wade": {
        "password": "2c6eccac92d3723c708c7dea066ce7b5c5f37c889a6227b6fc7266581542ba7f"
    },
}
class User(UserMixin):
    pass

#  ==== socket ====
roomInfo = {}
@socketio.on('join')
def join(data):
    roomID = data['room']
    user = data['username']
    if roomID not in roomInfo:
        roomInfo[roomID] = []
    try:
        if roomInfo[roomID].index(user) != -1:
            emit('loginFail', '')
            return
    except ValueError:
        pass
    roomInfo[roomID].append(user)
    # print('join room', roomInfo)
    join_room(data['room'])
    emit('sys', (f'{user}加入了房間', roomInfo[roomID]), room =  roomID)

@socketio.on('send_message')
def send_message(data):
    user = current_user.get_id()
    # print(roomInfo)
    msg = data['msg']
    roomID = data['roomID']
    create_date = datetime.now()
    create_time = create_date.strftime('%H:%M')
    emit('msg', (user,msg,create_time), room = roomID)


# @socketio.on('disconnect')
# def disconnect():
    # user = current_user.get_id()
    # if roomID  in roomInfo:
    #     roomInfo[roomID] = []
    # index = roomInfo[roomID].indexOf(user)
    # print('disconnect', roomInfo)
    # leave_room(room)

@socketio.on('get_disconnect')
def get_disconnect(roomID):
    user = current_user.get_id()
    roomInfo[roomID].remove(user)    
    # print('get_disconnect', roomID)
    emit('sys', (f'{user}退出了房間', roomInfo[roomID]), room =  roomID)

# ===== end socket =====

@login_manager.user_loader
def user_loader(user_id):
    if user_id not in users:
        return
    user = User()
    user.id = user_id
    return user

@app.route("/")
def index():
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "GET":
        if current_user.is_active:
            # if current_user.get_id() == 'osense':
            #     print('you are osense')
            
            return redirect(url_for("roomlist"))
        return render_template("login.html")
    else:
        user_id = request.form["user_id"]
        s = hashlib.sha256()
        s.update(request.form["password"].encode("utf-8"))
        hash_password = s.hexdigest()
        if (user_id in users) and (hash_password == users[user_id]["password"]):
            user = User()
            user.id = user_id
            login_user(user)

            return redirect(url_for("roomlist"))

        flash("login failed... ")
        return render_template("login.html")


@app.route("/logout")
def logout():
    user_id = current_user.get_id()
    logout_user()
    flash(f"See you next time")
    return render_template("login.html")


@app.route("/roomlist")
@login_required
def roomlist():
    if current_user.is_active:
        return render_template("room_list.html", messages=current_user.id)
        # return 'Logged in as: ' + current_user.id

@app.route("/room/<roomId>")
@login_required
def room(roomId):
    if current_user.is_active:
        return render_template("room.html", roomId = roomId, 
            username = current_user.id)

if __name__ == "__main__":
    # app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.debug = True
    socketio.run(app, host="127.0.0.1", port=5000)