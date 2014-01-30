var crypto = require('crypto');

var method = MessageHandler.prototype;

function MessageHandler(chatServer, logger) {
    this.logger = logger;
    this.chatServer = chatServer;
    this.conversations = {};
}

method.handleMessage = function(client, message) {
    var message = JSON.parse(message);
    switch(message.type){
        case 'requestHistory':
            var otherClient = this.chatServer.getClientById(message.user);
            var content = this.getConversation(client, otherClient);
            var message = {type:'conversation', user: otherClient.user.id, content: content};
            this.send(client, message);
            break;
        case 'message':
            var otherClient = this.chatServer.getClientById(message.user);
            var newContent = this.addLine(message.content, client, otherClient);
            var message = {type:'conversation', content: [newContent]};
            message.user = otherClient.user.id;
            this.send(client, message);
            message.user = client.user.id;
            this.send(otherClient, message);
            break;
    }
};

method.send = function(client, message){
    this.logger.log('info', 'Message to client ' + client.user.id + ' content: ' + JSON.stringify(message));
    client.connection.sendUTF(JSON.stringify(message));
};

method.getConversation = function(clientA, clientB) {
    var pairId = this.getClientsPairId(clientA, clientB);

    if(this.conversations[pairId]){
        return this.conversations[pairId]
    }else{
        return [];
    }
};

method.addLine = function(text, clientA, clientB) {
    var pairId = this.getClientsPairId(clientA, clientB);
    if(!this.conversations[pairId]){
        this.conversations[pairId] = [];
    }
    var conversation = this.conversations[pairId];
    var line = {user: clientA.user.name, content: text};
    conversation.push(line);
    return line;
};

method.getClientsPairId = function(clientA, clientB) {
    if ( clientA.user.id < clientB.user.id) {
        return clientA.user.id + clientB.user.id;
    }else{
        return clientB.user.id + clientA.user.id;
    }
};

module.exports = MessageHandler;