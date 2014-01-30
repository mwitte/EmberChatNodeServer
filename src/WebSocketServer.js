var ChatServerClass = require('./ChatServer');


var WebSocketServer = {
	/**
	 * Initialize the WebSocketServer
	 *
	 * @param httpServer needed for webSocket handshake
	 */
	init: function(httpServer, logger){
        var ChatServer = new ChatServerClass(logger);
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
			// @TODO check connection is from same origin request.origin
			var connection = request.accept(null, request.origin);

            var globalConnection = connection;

            ChatServer.connect(globalConnection);
			/**
			 * Client sent message
			 */
			connection.on('message', function(message) {
                ChatServer.message(message, globalConnection);
			});

			/**
			 * Client disconnected
			 */
			connection.on('close', function(connection) {
                ChatServer.disconnect(globalConnection);
			});
		});
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
	}
};
exports.server = WebSocketServer;