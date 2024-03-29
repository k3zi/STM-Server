process.env.NODE_ENV = process.argv[2];

var http = require('http');
var express = require('express');

var sio = require('socket.io');
var xio = require('socket.io-client');
var redis = require('socket.io-redis');

var mysql = require('mysql');

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

function connectMySQL() {
  mysqlDB = mysql.createConnection({
    host: 'localhost',
    user: 'stream_admin',
    database: 'stream_main',
    password: 'gbmpYiJq9f0KOQSjAj'
  });

  mysqlDB.connect(function(err) {
      if(err) {
          logger.error('error when connecting to db:', err);
          setTimeout(connectMySQL, 2000);
      }
  });

  mysqlDB.on('error', function(err) {
      logger.error('db error', err);

      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          connectMySQL();
      } else {
          throw err;
      }
  });
}

connectMySQL();

app.use(require('express-json-promise')());

var passThrough = {hostSocket: hostSocket, outputSocket: outputSocket, commentSocket: commentSocket, port: process.argv[3]};
require(config.directory.api + '/sockets')(passThrough);
var middlewares = require(config.directory.api + '/middlewares')(passThrough);
passThrough.middlewares = middlewares;

for (var k in config.versions) {
    app.use(config.versions[k], require('./routes' + config.versions[k])(passThrough));
}
