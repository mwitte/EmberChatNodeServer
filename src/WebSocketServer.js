Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};



var WebSocketServer = {
	/**
	 * contains the connected clients
	 */
	clients: {},

    nicknames: ['Matthias', 'Dominik', 'Prof. Dr. Bert', 'Bam Oida'],

	/**
	 * Initialize the WebSocketServer
	 *
	 * @param httpServer needed for webSocket handshake
	 */
	init: function(httpServer, logger){
        var _this = this;
		var webSocketServer = require('websocket').server;
		var wsServer = new webSocketServer({
			// WebSocket needs the http server for the handshake
			httpServer: httpServer
		});

		/**
		 * on Request
		 */
		wsServer.on('request', function(request) {
			logger.log('info', 'Connection from origin ' + request.origin);
			// @TODO check connection is from same origin request.origin
			var connection = request.accept(null, request.origin);

			var client = {
				connection: connection,
				settings: {},
                user: _this.generateUserData()
			};

			// save client's index for removing on disconnect
			var clientIndex = client.user.id;
			WebSocketServer.clients[client.user.id] = client;

			logger.log('info', 'Connection accepted with id ' + clientIndex);

            _this.sendInitialUserSettings(connection, client.user);
            _this.sendUserList(client);
            _this.broadCastUsers(client.user.id);

			/**
			 * Client sent message
			 */
			client.connection.on('message', function(message) {
                _this.processRawMessage(message, client);
			});

			/**
			 * Client disconnected
			 */
			client.connection.on('close', function(connection) {
                WebSocketServer.nicknames.push(client.user.name);
				logger.log('info', "Client " + client.connection.remoteAddress + " disconnected.");
				// remove user from the list of connected clients
				delete WebSocketServer.clients[clientIndex];

                _this.broadCastUsers('');
			});
		});
	},

    generateUserData: function() {
        var crypto = require('crypto');
        var seed = crypto.randomBytes(20);
        var userId = crypto.createHash('sha1').update(seed).digest('hex');

        var userData = {
            id: userId,
            name: String(WebSocketServer.nicknames.pop())
        };

        return userData;
    },

    sendInitialUserSettings: function(connection, user) {

        var crypto = require('crypto');
        var seed = crypto.randomBytes(20);
        var userId = crypto.createHash('sha1').update(seed).digest('hex');
        var initialSettings = {
            type: "settings",
            userName: user.name,
            userId: user.id
        };
        connection.sendUTF(JSON.stringify(initialSettings));
        WebSocketServer.nicknames.move(0, WebSocketServer.nicknames.length-1);
    },

    broadCastUsers: function(currentClientUserId) {
        for (var clientId in WebSocketServer.clients) {
            var client = WebSocketServer.clients[clientId];
            if(currentClientUserId !== client.user.id){
                this.sendUserList(client);
            }
        }
    },

    sendUserList: function(currentClient) {
        var usersData = [];
        for (var clientId in WebSocketServer.clients) {
            var client = WebSocketServer.clients[clientId];
            if(currentClient.user.id !== client.user.id){
                usersData.push(client.user);
            }
        }

        var message = {
            type: "userlist",
            content: usersData
        };
        currentClient.connection.sendUTF(JSON.stringify(message));
    },

	/**
	 * Sends a message to all connected clients
	 * @param message
	 */
	broadcast: function(message){
		// iterate over existing clients
		Object.keys(WebSocketServer.clients).forEach(function(index) {
			WebSocketServer.send(WebSocketServer.clients[index], message)
		});
	},

	/**
	 * Sends a message to a specific client
	 *
	 * @param client
	 * @param message
	 */
	send: function(client, message){
		//client.connection.sendUTF(JSON.stringify(message));
        client.connection.sendUTF(message);
	},


    processRawMessage: function(message, client){
        if (message.type === 'utf8') {
            client.connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            client.connection.sendBytes(message.binaryData);
        }
    }
};
exports.server = WebSocketServer;