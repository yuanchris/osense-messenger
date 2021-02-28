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

factory_list = ['osense', 'timtos']

class User(UserMixin):
    pass

#  ==== socket ====
mesList = {}
mes_factory = {x : {} for x in factory_list}
mes_client = {}

@socketio.on('msgFromClient')
def msgFromClient(msg):
    if msg['from'] not in mes_client:
        mes_client[msg['from']] = {}
    if msg['name'] not in mes_client[msg['from']]:
        mes_client[msg['from']][msg['name']] = {
            'list': [],
            'noread': True
        }
        mes_factory[msg['name']][msg['from']]= {
            'list': [],
            'noread': True
        }
    mes_client[msg['from']][msg['name']]['list'].append(msg)

    # if msg['from'] not in mes_factory['name']:
    #     mes_factory['name']['from']= {
    #         'list': [],
    #         'noread': True
    #     }
    mes_factory[msg['name']][msg['from']]['list'].append(msg)
    emit(msg['name'], msg, broadcast=True)
    print(mes_client)

@socketio.on('msgFromFactory')
def msgFromFactory(msg):
    # if msg['name'] not in mes_factory[msg['from']]:
    #     mes_factory[msg['from']][msg['name']] = {
    #         'list': [],
    #         'noread': True
    #     }
    mes_factory[msg['from']][msg['name']]['list'].append(msg)
    mes_client[msg['name']][msg['from']]['list'].append(msg)
    emit(msg['name'], msg, broadcast=True)
    print(mes_factory)



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
                return redirect(url_for("client"))
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
                return redirect(url_for("client"))

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

# ==== data api =====
@app.route("/get_factory_list")
def get_factory_list():
    global factory_list
    return jsonify(factory_list)

@app.route("/get_history_msg")
def get_history_msg():
    global mesList
    clientOrFactory = request.args['clientOrFactory']
    name = request.args['name']

    # http://127.0.0.1:5000/get_history_msg?clientOrFactory=factory&factory=456&client=789
    if clientOrFactory == 'factory':
        if name in mes_factory:
            return jsonify(mes_factory[name])
    else:
        if name in mes_client:
            return jsonify(mes_client[name])

    return jsonify('Not found')

if __name__ == "__main__":
    # app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.debug = True
    socketio.run(app, host="127.0.0.1", port=5000)