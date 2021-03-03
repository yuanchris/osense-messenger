from flask import Flask, render_template, jsonify
import socket, json, pymongo, time
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
    'steven':{
        "password": "2c6eccac92d3723c708c7dea066ce7b5c5f37c889a6227b6fc7266581542ba7f"
    }
}

factory_list = ['osense', 'timtos', 'google', 'amazon','tsmc']

class User(UserMixin):
    pass

# === mongo =====
myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["osense-messenger"]
collection_mes_factory = mydb["mes_factory"]
collection_mes_client = mydb["mes_client"]

# col_list = mydb.list_collection_names()

# if 'mes_factory' not in col_list:
#     mes_factory = {x : {} for x in factory_list}
# else: 
#     mongo_mes_factory = mydb["mes_factory"].find()

# if 'mes_client' not in col_list:
#     mes_client = {}
# else: 
#     mongo_mes_client = mydb["mes_factory"].find()


#  ==== socket ====

mes_factory = {x : {} for x in factory_list}
mes_client = {}

@socketio.on('msgFromClient')
def msgFromClient(msg):
    # if msg['from'] not in mes_client:
    #     mes_client[msg['from']] = {}
    # if msg['name'] not in mes_client[msg['from']]:
    #     mes_client[msg['from']][msg['name']] = {
    #         'list': [],
    #         'noread': True
    #     }
    #     mes_factory[msg['name']][msg['from']]= {
    #         'list': [],
    #         'noread': True
    #     }

    # mes_client[msg['from']][msg['name']]['list'].append(msg)
    # mes_factory[msg['name']][msg['from']]['list'].append(msg)

    emit(msg['name'], msg, broadcast=True)
    client = msg['from']
    factory = msg['name']
    start = time.time()
    collection_mes_factory.find_one_and_update({'name': factory, 'to': client, 'noread':'false'}, 
    {'$push': { 'list': msg }},upsert=True)
    collection_mes_client.find_one_and_update({'name': client, 'to': factory, 'noread':'false'}, 
    {'$push': { 'list': msg }},upsert=True)
    print('elapsed time ', time.time()-start)
    
    # print(mes_client)

@socketio.on('msgFromFactory')
def msgFromFactory(msg):

    # mes_factory[msg['from']][msg['name']]['list'].append(msg)
    # mes_client[msg['name']][msg['from']]['list'].append(msg)
    emit(msg['name'], msg, broadcast=True)

    client = msg['name']
    factory = msg['from']

    start = time.time()

    collection_mes_factory.find_one_and_update({'name': factory, 'to': client, 'noread':'false'}, 
    {'$push': { 'list': msg }},upsert=True)
    collection_mes_client.find_one_and_update({'name': client, 'to': factory, 'noread':'false'}, 
    {'$push': { 'list': msg }},upsert=True)
    
    # print(mes_factory)
    print('elapsed time ', time.time()-start)


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
                return redirect(url_for("factory"))
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
                return redirect(url_for("factory"))
            else:
                return redirect(url_for("client"))

        flash("login failed... ")
        return render_template("login.html")

# @app.route("/factory/<factory_id>")
# @login_required
# def factory(factory_id):
#     return render_template("factory.html", factory_id = factory_id)

@app.route("/factory")
@login_required
def factory():
    return render_template("factory.html", factory_id = current_user.id)


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
    global mes_factory, mes_client
    clientOrFactory = request.args['clientOrFactory']
    name = request.args['name']
    return_message = {}
    # http://127.0.0.1:5000/get_history_msg?clientOrFactory=factory&name=osense
    if clientOrFactory == 'factory':

        # if name in mes_factory:
        #     return jsonify(mes_factory[name])
        history_msg = collection_mes_factory.find({'name': name},
         { "_id": 0 })        
        for row in history_msg:
            return_message[row['to']] = {'list' : row['list'], 'noread': row['noread']}
        return return_message

    else:
        # if name in mes_client:
        #     return jsonify(mes_client[name])
        history_msg = collection_mes_client.find({'name': name},
         { "_id": 0})
        for row in history_msg:
            return_message[row['to']] = {'list' : row['list'], 'noread': row['noread']}
        return return_message
    return jsonify('Not found')

if __name__ == "__main__":
    # app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.debug = True
    socketio.run(app, host="127.0.0.1", port=5000)