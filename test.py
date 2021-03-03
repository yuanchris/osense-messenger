import pymongo
# https://www.runoob.com/python3/python-mongodb.html

# myclient = pymongo.MongoClient("mongodb://localhost:27017/")
# mydb = myclient["runoobdb"]
# mycol = mydb["mes_client"]
# mydict = { "name": "Google", "alexa": "1", "url": "https://www.google.com" }

# x = mycol.insert_one(mydict)
# print(x.inserted_id)

myclient = pymongo.MongoClient("mongodb://localhost:27017/")
mydb = myclient["osense-messenger"]
collection_mes_factory = mydb["mes_factory"]
collection_mes_client = mydb["mes_client"]

collection_mes_factory.find_one_and_update({'name': 'osense', 'to': 'chris', 'noread':'false'}, 
{'$push': { 'list': {'from':'chris','text': 'hi', 'to': 'osense'} }},upsert=True)