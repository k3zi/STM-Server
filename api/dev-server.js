//************** IMPORTANT INCLUDES **************\\\
var http = require('http');
var express = require('express');

var sio = require('socket.io');
var xio = require('socket.io-client');
var redis = require('socket.io-redis');

var mysql = require('mysql');
var Hashids = require("hashids");
var fs = require("fs");

//Cryptography
var md5 = require('md5');
var crypto = require('crypto');

//Misc
var apn = require('apn');
var isThere = require("is-there");
var domain = require('domain');
var Promise = require('promise');

//Middleware
var cookieParser = require('cookie-parser');
var session = require('express-session');
var basicAuth = require('basic-auth');
var bodyParser = require('body-parser');
var helmet = require('helmet');

var config = require('config');
var db = require('./data/db');

var hasher = new Hashids(config.hash.salt, config.hash.minLength, config.hash.characters);
var apnConnection = new apn.Connection(config.apn);

//************** Let's Connect Everything! **************\\\
console.log('Running Fork on Port: %d', process.argv[3]);

var app = new express();
app.set('trust proxy', 1);

//Use Middleware
app.use(cookieParser());
app.use(session({
    secret: 'pTb8zDt8drE69B949bHx',
    expires: new Date(Date.now() + 3600000 * 24),
    resave: true,
    saveUninitialized: true
}));

var server =  http.Server(app);
var io = sio(server);
var adapter = redis({ host: '127.0.0.1', port: 6379 });
io.adapter(adapter);

server.listen(process.argv[3], '127.0.0.1');

var hostSocket = io.of('/host');
var outputSocket = io.of('/output');
var commentSocket = io.of('/comment');
var mainSocket = io.of('/main');

function connectMySQL() {
  mysqlDB = mysql.createConnection({
    host: 'localhost',
    user: 'stream_admin',
    database: 'stream_main',
    password: 'gbmpYiJq9f0KOQSjAj'
  });

  mysqlDB.connect(function(err) {
      if(err) {
          console.log('error when connecting to db:', err);
          setTimeout(connectMySQL, 2000);
      }
  });

  mysqlDB.on('error', function(err) {
      console.log('db error', err);

      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          connectMySQL();
      } else {
          throw err;
      }
  });
}

connectMySQL();

for (var k in config.versions) {
    app.use(config.versions[k], require('./routes' + config.versions[k]));
}
