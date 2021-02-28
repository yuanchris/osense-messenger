from flask import Flask, render_template, jsonify
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
        "factory": True,
        "password": "2c6eccac92d3723c708c7dea066ce7b5c5f37c889a6227b6fc7266581542ba7f"
    },
    "timtos": {
        "factory": True,
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
talkList = {}
clientList = []
mesList = {}
onlinePeople = 0

@socketio.on('factoryJoin') # 廠商進入
def factoryJoin(factory_id):
    print('factoryJoin:', factory_id)
    join_room(factory_id)


@socketio.on('clientJoin') # 客戶進入
def clientJoin(username, factory_id):
    # print('client in')
    global onlinePeople 
    onlinePeople += 1
    obj = {
      'name': username,
      'flag': onlinePeople
    }
    # clientList.append(obj)
    join_room(factory_id)

    emit('clientInto', obj, room = factory_id)


@socketio.on('clientOut') 
def clientOut(username, factory_id):
    # print('client out')
    # obj = username
    # for i in range(len(clientList)):
    #     if clientList[i]['name'] == username:
    #         obj = clientList[i]['name']
    #         clientList.pop(i)
    #         break
    
    emit('clientLeave', username, room = factory_id)


@socketio.on('msgFromClient')
def msgFromClient(msg):
    # obj = {
    #     'from': 'client',
    #     'content': msg['content'],
    #     'name': msg['name'],
    #     # 'time': datetime.now().strftime('%m-%d, %H:%M')
    # }
    if msg['room'] not in mesList:
        mesList[msg['room']] = {}
    if msg['name'] not in mesList[msg['room']]:
        mesList[msg['room']][msg['name']] = {
            'list': [],
            'name': msg['name'],
            'noread': True
        }
    mesList[msg['room']][msg['name']]['list'].append(msg)
    emit('reciveClientMsg', msg, room = msg['room'])
    print(mesList)
@socketio.on('msgFromFactory')
def msgFromFactory(msg):
    # print('talkList: ', talkList)
    # if msg['to']['name'] not in talkList:
    #     talkList[msg['to']['name']] = []

    # talkList[msg['to']['name']].append({
    #     'from': 'serve',
    #     'content': msg['content'],
    # })

    if msg['room'] not in mesList:
        mesList[msg['room']] = {}
    print(type(msg['name']), msg['name'])
    if msg['name'] not in mesList[msg['room']]:
        mesList[msg['room']][msg['name']] = {
            'list': [],
            'name': msg['name'],
            'noread': False
        }
    mesList[msg['room']][msg['name']]['list'].append(msg)
    emit(msg['name'], msg, room = msg['room'])
    print(mesList)


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
            if 'factory' in users[current_user.get_id()] and users[current_user.get_id()]['factory'] == True:
                return redirect(url_for("factory", factory_id = current_user.get_id()))
            else:
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
            if 'factory' in users[current_user.get_id()] and users[current_user.get_id()]['factory'] == True:
                return redirect(url_for("factory", factory_id = user_id))
            else:
                return redirect(url_for("roomlist"))

        flash("login failed... ")
        return render_template("login.html")

@app.route("/factory/<factory_id>")
@login_required
def factory(factory_id):
    return render_template("factory.html", factory_id = factory_id)


@app.route("/logout")
def logout():
    # user_id = current_user.get_id()
    logout_user()
    flash(f"See you next time")
    return render_template("login.html")


@app.route("/roomlist")
@login_required
def roomlist():
    if current_user.is_active:
        return render_template("room_list.html", messages=current_user.id)
        # return 'Logged in as: ' + current_user.id

@app.route("/room/<factory_id>")
@login_required
def room(factory_id):
    if current_user.is_active:
        return render_template("client.html", factory_id = factory_id, 
            username = current_user.id)

@app.route("/client")
@login_required
def client():
    return render_template("client.html",  username = current_user.id)

@app.route("/get_history_msg")
def get_history_msg( client = None):
    global mesList
    clientOrFactory = request.args['clientOrFactory']
    factory = request.args['factory']
    if clientOrFactory == 'client':
        client = request.args['client']
        # print('get_history_msg:', clientOrFactory, factory, client)

    # http://127.0.0.1:5000/get_history_msg?clientOrFactory=factory&factory=456&client=789
    if factory in mesList:
        if clientOrFactory == 'factory':
                return jsonify(mesList[factory])
        else:
            if client in mesList[factory]:
                return jsonify(mesList[factory][client]['list'])
    return jsonify('Not found')

if __name__ == "__main__":
    # app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.debug = True
    socketio.run(app, host="127.0.0.1", port=5000)