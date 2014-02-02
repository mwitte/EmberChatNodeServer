var crypto = require('crypto');
var MessageHandlerClass = require('./ChatServer/MessageHandler');

var RoomRepositoryClass = require('./ChatServer/RoomRepository');

var method = ChatServer.prototype;

function ChatServer(logger) {
    this.logger = logger;
    this.clients = {};
    this.users = [
        {id: 'de713bf89dd84fd5648a08b8ba4a5d1b18a964c1', name: 'Matthias'},
        {id: '01b7974ee4de9fba4cb4e777a29673163ed4347d', name: 'Dominik'},
        {id: '22caebc61d4bbdf69fa6b19da6b10ae3dca5a2cf', name: 'Prof. Dr. Bert'},
        {id: '43954a1bc424d641406148334c3c4defa4b45f47', name: 'Bam Oida'}
    ];

    this.roomRepository = new RoomRepositoryClass();

    this.messageHandler = new MessageHandlerClass(this, logger);

    this.logger.log('info', 'Chatserver started');
}

method.getClients = function(){
    return this.clients;
};

method.getClientById = function(id){
    return this.clients[id];
};



method.connect = function(connection) {

    this.logger.log('info', 'Client connected with ' + connection.remoteAddress);

    var client = {
        connection: connection,
        settings: {},
        user: this.generateUserData()
    };
    this.clients[client.user.id] = client;

    this.sendInitialUserSettings(client);
    this.broadcastUserList(client.user.id);
};


method.message = function(message, connection) {
    var client = this.findClientByConnection(connection);
    if(!client){
        return null;
    }
    if (message.type === 'utf8') {

        this.logger.log('info', 'Client message from ' + client.user.id + ' content: ' + message.utf8Data);

        var response = this.messageHandler.handleMessage(client, message.utf8Data);

        if(response){
            client.connection.sendUTF(JSON.stringify(response));
        }
    }
    else if (message.type === 'binary') {
        //@TODO ??
        client.connection.sendBytes(message.binaryData);
    }
};


method.disconnect = function(connection) {

    for (var clientId in this.clients) {
        var client = this.clients[clientId];
        if(client.connection === connection){

            this.logger.log('info', 'Client disconnected: ' + client.user.id);
            delete this.clients[client.user.id];
            this.users.push(client.user);
            this.broadcastUserList();
            break;
        }
    }
};

method.findClientByConnection = function(connection){
    for (var clientId in this.clients) {
        var client = this.clients[clientId];
        if(client.connection === connection){
            return client;
        }
    }
    return null;
};

method.generateHash = function() {
    var seed = crypto.randomBytes(20);
    return crypto.createHash('sha1').update(seed).digest('hex');
};

method.generateUserData = function() {
    /*
    var seed = crypto.randomBytes(20);
    var userId = crypto.createHash('sha1').update(seed).digest('hex');
    */
    return this.users.shift();
};

method.sendInitialUserSettings= function(client) {
    var initialSettings = {
        type: "Settings",
        user: client.user
    };
    client.connection.sendUTF(JSON.stringify(initialSettings));
};

method.broadcastUserList = function() {
    for (var clientId in this.clients) {
        var client = this.clients[clientId];
        this.sendUserList(client);
    }
};

method.sendUserList = function(currentClient) {
    var usersData = [];
    for (var clientId in this.clients) {
        var client = this.clients[clientId];
        if(currentClient.user.id !== client.user.id){
            usersData.push(client.user);
        }
    }

    var message = {
        type: "Userlist",
        content: usersData
    };
    currentClient.connection.sendUTF(JSON.stringify(message));
};

module.exports = ChatServer;