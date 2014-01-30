var crypto = require('crypto');
var MessageHandlerClass = require('./ChatServer/MessageHandler');

var method = ChatServer.prototype;

function ChatServer(logger) {
    this.logger = logger;
    this.clients = {};
    this.nicknames = ['Matthias', 'Dominik', 'Prof. Dr. Bert', 'Bam Oida'];
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

            var id = String(client.user.id);
            var name = String(client.user.name);
            delete this.clients[client.user.id];
            this.nicknames.push(name);
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

method.sendInitialUserSettings= function(client) {
    var initialSettings = {
        type: "settings",
        userName: client.user.name,
        userId: client.user.id
    };
    client.connection.sendUTF(JSON.stringify(initialSettings));
};


method.generateUserData = function() {
    var seed = crypto.randomBytes(20);
    var userId = crypto.createHash('sha1').update(seed).digest('hex');

    return {
        id: userId,
        name: String(this.nicknames.shift())
    };
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
        type: "userlist",
        content: usersData
    };
    currentClient.connection.sendUTF(JSON.stringify(message));
};

module.exports = ChatServer;