var currentClient = { flag: -1, name: null };
var clientList = {}; // 聊天紀錄
clientList = 
{
    "osense":{
        "wade": {
            "list": [
                {
                    from: 'client',
                    name: username,
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                    room: 'osense',
                },
                {
                    from: 'factory',
                    to: currentClient,
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                    room: 'osense',
                }
            ],
            "name": wade,
            "flag": 11,
            "noread": false
        },
        "chris": {
            "list": [
                {
                    from: 'client',
                    name: username,
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                    room: 'osense',
                },
                {
                    from: 'factory',
                    to: currentClient,
                    content: text,
                    time: formatDate(parseInt(Date.now()), 'MM-dd hh:mm'),
                    room: 'osense',
                }
            ],
            "name": chris,
            "flag": 12,
            "noread": false
            },
    },
        

}