process.env.NODE_ENV = process.argv[2];
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var http = require('http');
var express = require('express');

var sio = require('socket.io');
var xio = require('socket.io-client');
var redis = require('socket.io-redis');

var mysql = require('promise-mysql');

//Misc
var Promise = require('bluebird');

var config = require('config');
var db = require('./data/db');
var logger = config.log.logger;

//************** Let's Connect Everything! **************\\\
logger.info('Running Fork on Port: %d', process.argv[3]);

var app = new express();
app.set('trust proxy', 1);

var server =  http.Server(app);
var io = sio(server);
var adapter = redis({ host: '127.0.0.1', port: 6379 });
io.adapter(adapter);

server.listen(process.argv[3], '127.0.0.1');

var hostSocket = io.of('/host');
var outputSocket = io.of('/output');
var commentSocket = io.of('/comment');

app.use(require('express-json-promise')());

var passThrough = {hostSocket: hostSocket, outputSocket: outputSocket, commentSocket: commentSocket, port: process.argv[3]};
passThrough.mysql = mysql.createPool(config.mysql);

require(config.directory.api + '/sockets')(passThrough);

var middlewares = require(config.directory.api + '/middlewares')(passThrough);
passThrough.middlewares = middlewares;

app.use('/.well-known', express.static('/home/stm/.well-known'));

for (var k in config.versions) {
    app.use(config.versions[k], require('./routes' + config.versions[k])(passThrough));
}

var hookshot = require('hookshot');
app.use('/github-hook', hookshot('refs/heads/master', 'git pull && make'));
