
var ChatServer = {
    host: 'localhost',
    httpPort: 3000,
    socketPort: 61457,
    path: '',
    timeout: 5000,
    logfile: '../server.log'
};

/**
 * For logging
 */
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: __dirname + '/'+ ChatServer.logfile })
    ]
});


/**
 * Http server is only needed for webSocket handshake
 */
var http = require('http');
var httpServer = http.createServer(function(request, response) { });
httpServer.listen(ChatServer.socketPort, function() {
    logger.log('info', "Server is listening on port " + ChatServer.socketPort);
});

var WebSocketServer = require('./WebSocketServer');

/**
 * Initialize the WebSocketServer
 */
WebSocketServer.server.init(httpServer, logger);