//************** IMPORTANT INCLUDES **************\\\
var http = require('http');
var express = require('express');

var sio = require('socket.io');
var xio = require('socket.io-client');
var redis = require('socket.io-redis');

var seraph = require("seraph");
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

//Middleware
var cookieParser = require('cookie-parser');
var session = require('express-session');
var basicAuth = require('basic-auth');
var bodyParser = require('body-parser');
var helmet = require('helmet');

//************** SERVER SETTINGS **************\\\
var API_CONTENT_DIRECTORY = "/home/stream/user_content";
var API_AUTH_USER = 'STM-API';
var API_AUTH_PASS = "PXsd<rhKG0r'@U.-Z`>!9V%-Z<Z";
var STM_HASH = "Jkbtui5Czz55e2QtuMLjhrduXg0lCWBm3OkH4wyDmnXNLWC8tG";
var STM_STREAM_SETTINGS = {
    'secondsRequiredToStartPlaying': 1.5,
    'secondsRequiredToStartPlayingAfterBufferUnderun': 3.0,
    //'bufferSizeInSeconds': 10.0
};
var STM_CONFIG = {
    'hashSalt': 'pepper',
    'hashMinLength': '4',
    'hashChars': 'abcdefghijkmnpqrstuxyACDEFGHKMNPQRSTUQY23456789'
}

//************** Apple Push Notifications **************\\\
var apnConnection = new apn.Connection({
    'cert': '/home/stream/keychain/production_com.stormedgeapps.streamtome.pem',
    'key': '/home/stream/keychain/production_com.stormedgeapps.streamtome.pkey',
    "production": true
});
var apnConnectionDev = new apn.Connection({
    'cert': '/home/stream/keychain/development_com.stormedgeapps.streamtome.pem',
    'key': '/home/stream/keychain/development_com.stormedgeapps.streamtome.pkey',
    "production": false
});

//Authentication

var regularAuth = function(req, res, next) {
    var auth = basicAuth(req);
    var authorized = auth && auth.name && auth.pass && auth.name === API_AUTH_USER && auth.pass === API_AUTH_PASS;
    return determineAuthentication(authorized, req, res, next);
};

var sessionAuth = function(req, res, next) {
    var auth = basicAuth(req);
    var authorized = auth && auth.name && auth.pass && auth.name === API_AUTH_USER && auth.pass === API_AUTH_PASS;
    var session = req.session.user;

    if (!session && authorized && req.get('stm-username') && req.get('stm-password')) {
        reauthenticate(req, req.get('stm-username'), req.get('stm-password'), function (valid) {
            session = valid;
            determineAuthentication(authorized && session, req, res, next);
        });
    } else {
        determineAuthentication(authorized && session, req, res, next);
    }
};

var decrypt = function(encryptedMessage, encryptionMethod, secret, iv) {
    var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
    return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
};

var jsonParser = bodyParser.json({limit: '50mb'});
var urlEncodeHandler = bodyParser.urlencoded({limit: '50mb', extended: true});

//TODO: Handle errors
var d = domain.create();
d.on('error', function(err) {
    console.log(err);
});

if (!Date.secNow) {
    Date.secNow = function() {
        return Math.floor((new Date().getTime()) / 1000);
    }
}


//************** Let's Connect Everything! **************\\\
console.log('Running Fork on Port: %d', process.argv[2]);

var app = new express();
app.set('trust proxy', 1);

//Use Middleware
app.use(express.static(API_CONTENT_DIRECTORY));
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

server.listen(process.argv[2], '127.0.0.1');

var hostSocket = io.of('/host');
var outputSocket = io.of('/output');
var commentSocket = io.of('/comment');
var mainSocket = io.of('/main');

//DB
var db = seraph({
    'server': 'http://69.4.80.29:7474',
    user: 'neo4j',
    pass: 'gbmpYiJq9f0KOQSjAj'
});

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

//Hashing
var hasher = new Hashids(STM_CONFIG.hashSalt, STM_CONFIG.hashMinLength, STM_CONFIG.hashChars);

//****************** REGULAR AUTH METHODS ********************\\

app.post('/v1/createAccount', jsonParser, urlEncodeHandler, regularAuth, function(req, res) {
    var postData = req.body;

    function callbackAllCheckout(err, results) {
        if (results.length > 0) {
            return res.json(outputError('A user is already using this email'));
        }

        db.save({
            username: postData.username,
            password: hashPass(postData.password),
            unverifiedEmail: postData.email,
            displayName: postData.displayName
        }, 'User', function(err, result) {
            if (err) {
                res.json(outputError('There was a database error. Oops :('));
            } else {
                res.json(outputResult({}));
            }
        });
    }

    function callbackCheckUsermame(err, results) {
        if (err) throw err;
        if (results.length > 0) {
            return res.json(outputError('A user is already using this email'));
        }

        db.find({
            username: postData.username
        }, 'User', callbackAllCheckout);
    }

    db.find({
        email: postData.email
    }, 'User', callbackCheckUsermame);
});


app.post('/v1/signIn', jsonParser, urlEncodeHandler, regularAuth, function(req, res) {
    var postData = req.body;
    db.find({
        username: postData.username,
        password: hashPass(postData.password)
    }, 'User', function(err, results) {
        if (err) {
            throw err;
        }

        if (results.length == 0) {
            return res.json(outputError('Invalid username/password'));
        }

        var user = results[0];
        req.session.user = user;
        ensureExists(getUserDir(user.id), function(err) {
            res.json(outputResult(user));
        });
    });
});

app.post('/v1/authenticate', jsonParser, urlEncodeHandler, regularAuth, function(req, res) {
    var data = req.body;
    db.find({
        username: data.username,
        password: data.password
    }, 'User', function(err, results) {
        if (!results || results.length == 0) {
            console.log(err);
            return res.json(outputError('Invalid username/password'));
        }

        var user = results[0];
        req.session.user = user;
        ensureExists(getUserDir(user.id), function(err) {
            res.json(outputResult(user));
        });
    });
});

//******************** SESSION AUTH METHODS ******************\\

app.post('/v1/updateAPNS', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var token = data.token;
    var user = req.session.user;

    user.apnsToken = token;
    db.save(user, function(err, user) {
        if (err) throw err;

        req.session.user = user;
        res.json(outputResult(user));
    });
});

app.get('/v1/streams/user/:userID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var userID = parseInt(req.params.userID) < 1 ? user.id : parseInt(req.params.userID);

    var cypher = "START x = node({userID}) MATCH x -[:createdStream]->(stream) RETURN stream";
    db.query(cypher, {
        'userID': userID
    }, function(err, results) {
        res.json(outputResult(results));
    });
});

app.get('/v1/delete/stream/:streamID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var userID = user.id;
    var streamID = parseInt(req.params.streamID);

    var cypher = "START x = node({userID}) MATCH x -[:createdStream]-> (stream) WHERE id(stream) = {streamID} DETACH DELETE stream";
    db.query(cypher, {
        'userID': userID,
        'streamID': streamID
    }, function(err, results) {
        res.json(outputResult({}));
    });
});

app.post('/v1/createStream', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var userDir = getUserDir(user.id);
    var private = data.passcode.length > 0;
    var arr = {
        'name': data.name,
        'private': private,
        'description': data.description
    };

    if (private) arr.passcode = data.passcode;
    db.save(arr, 'Stream', function(err, stream) {
        if (err) {
            res.json(outputError('There was a database error. Oops :('));
        } else {
            relateUserToStream(stream);
        }
    });

    function relateUserToStream(stream) {
        db.relate(user, 'createdStream', stream, {
            'date': Date.secNow()
        }, function(err, relationship) {
            setupStream(stream);
        });
    }

    function setupStream(stream) {
        var streamAlphaID = encodeStr(stream.id);
        var lockFile = userDir + streamAlphaID + '.aac.lock';
        isThere(lockFile, function(exists) {
            if (exists) fs.unlinkSync(lockFile);

            var securityHash = random(10);
            fs.closeSync(fs.openSync(lockFile, 'w'));
            fs.appendFileSync(lockFile, securityHash);

            //Tell Followers
            //sendMessageToAPNS(userInfo['name'] + ' created a stream called ' + stream['name'], followers[i]['token']); //Token length 64
            stream.streamAlphaID = streamAlphaID;
            stream.securityHash = securityHash;
            db.save(stream, function(err, stream) {
                res.json(outputResult(stream));
            });
        });
    }
});

app.post('/v1/continueStream/:streamID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var streamID = parseInt(req.params.streamID);
    var streamAlpha = encodeStr(streamID);
    var userDir = getUserDir(user.id);

    var recordFile = userDir + streamAlpha + '.aac';
    var lockFile = userDir + streamAlpha + '.aac.lock';

    var cypher = "START x = node({userID}) MATCH x -[:createdStream]->(stream) WHERE id(stream) = {streamID} RETURN stream";
    var params = {
        'userID': user.id,
        'streamID': streamID
    };
    db.query(cypher, params, function(err, results) {
        if (results.length == 0) {
            return res.json(outputError("The stream could not be found."));
        }

        var stream = results[0];

        isThere(recordFile, function(exists) {
            if (exists)fs.unlinkSync(recordFile);

            isThere(lockFile, function(exists) {
                if (exists)fs.unlinkSync(lockFile);
                var securityHash = random(10);
                fs.closeSync(fs.openSync(lockFile, 'w'));
                fs.appendFileSync(lockFile, securityHash);

                //Tell Followers
                //sendMessageToAPNS(userInfo['name'] + ' created a stream called ' + stream['name'], followers[i]['token']); //Token length 64
                stream.securityHash = securityHash;
                db.save(stream, function(err, stream) {
                    res.json(outputResult(stream));
                });
            });
        });
    });
});

//**********************************************************************
//************************ In Stream Content ***************************
//**********************************************************************

app.post('/v1/stream/:streamID/comment', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var userID = user.id;
    var streamID = parseInt(req.params.streamID);

    var arr = {
        'text': data.text,
        'date': Date.secNow()
    };

    db.save(arr, 'Comment', function(err, comment) {
        if (err) {
            res.json(outputError('There was a database error. Oops :('));
        } else {
            relateUserToComment(comment);
        }
    });

    function relateUserToComment(comment) {
        db.relate(user, 'createdComment', comment, {}, function(err, relationship) {
            relateCommentToStream(comment, streamID);
        });
    }

    function relateCommentToStream(comment, stream) {
        db.relate(comment, 'on', stream, {}, function(err, relationship) {
            res.json(outputResult({}));
        });
    }
});

app.get('/v1/stream/:streamID/comments', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var streamID = parseInt(req.params.streamID);

    var cypher = "START stream = node({streamID}) MATCH (comment: Comment) -[:on]-> (stream) MATCH (user: User) -[:createdComment]-> (comment) RETURN comment, user ORDER BY comment.date DESC LIMIT 50";
    var params = {
        'streamID': streamID
    };
    db.query(cypher, params, function(err, results) {
        for (var i = 0; i < results.length; i++) {
            results[i] = joinDictWithUser(results[i]['comment'], results[i]['user']);
        }
        return res.json(outputResult(results));
    });
});

//**********************************************************************
//**************************** Dashboard *******************************
//**********************************************************************

app.get('/v1/dashboard', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var items = [];

    var cypher = "MATCH (stream: Stream) RETURN stream LIMIT 10";
    var params = {
    };
    db.query(cypher, params, function(err, results) {
        if (results.length > 0) {
            items.push({'name': 'Active Streams (You Follow)', 'items': results});
        }

        getFeaturedItems(items);
    });

    function getFeaturedItems(items) {
        var cypher = "MATCH (stream: Stream) RETURN stream LIMIT 10";
        var params = {
        };
        db.query(cypher, params, function(err, results) {
            if (results.length > 0) {
                items.push({'name': 'Featured Streams', 'items': results});
            }
            return res.json(outputResult(items));
        });
    }
});

app.get('/v1/follow/:userID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var userID = parseInt(req.params.userID);

    db.relate(user, 'follows', userID, {}, function(err, relationship) {
        res.json(outputResult({}));
    });
});

app.get('/v1/unfollow/:userID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var userID = parseInt(req.params.userID);

    var cypher = "MATCH (fromUser: User)-[r:follows]->(toUser: User) WHERE id(fromUser) = {fromID} AND id(toUser) = {toID} DELETE r";
    var params = {
        'fromID': user.id,
        'toID': userID
    };
    db.query(cypher, params, function(err, results) {
        res.json(outputResult({}));
    });
});

app.get('/v1/comment/like/:commentID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var commentID = parseInt(req.params.commentID);

    db.relate(user, 'likes', commentID, {}, function(err, relationship) {
        console.log(err);
        res.json(outputResult({}));
    });
});

app.get('/v1/comment/unlike/:commentID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var commentID = parseInt(req.params.commentID);

    var cypher = "MATCH (fromUser: User)-[r:likes]->(comment: Comment) WHERE id(fromUser) = {fromID} AND id(comment) = {commentID} DELETE r";
    var params = {
        'fromID': user.id,
        'commentID': commentID
    };
    db.query(cypher, params, function(err, results) {
        console.log(err);
        res.json(outputResult({}));
    });
});

app.post('/v1/search', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var items = [];
    var q = req.body.q;
    var likeString = "'(?i).*" + q + ".*'";

    var cypher = "MATCH (user: User) WHERE user.displayName =~ " + likeString + " OR user.username =~ " + likeString + " OPTIONAL MATCH (thisUser)-[isFollowing:follows]->(user)  WHERE id(thisUser) = {userID} RETURN user, isFollowing LIMIT 5";
    var params = {
        'userID': user.id
    };
    db.query(cypher, params, function(err, results) {
        for (var i in results) {
            var user = results[i]['user'];
            user['_type'] = 'STMUser';
            user['isFollowing'] = (results[i]['isFollowing'] ? true : false)
            items.push(user);
        }

        searchForStreams();
    });

    function searchForStreams() {
        var cypher = "MATCH (stream: Stream) WHERE stream.name =~ " + likeString + " OR stream.description =~ " + likeString + " RETURN stream LIMIT 5";
        var params = {
        };
        db.query(cypher, params, function(err, results) {
            for (var i in results) {
                results[i]['_type'] = 'STMStream';
                items.push(results[i]);
            }

            return res.json(outputResult(items));
        });
    }
});

app.get('/v1/dashboard/comments', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;

    var cypher = "MATCH (stream: Stream)<-[:on]-(comment: Comment)<-[:createdComment]-(commentUser: User)-[:follows*0..1]->(user :User) WHERE id(user) = {userID} RETURN comment, stream, commentUser AS user ORDER BY comment.date DESC";
    db.query(cypher, {
        'userID': user.id
    }, function(err, results) {
        for(var i = 0; i < results.length; i++) {
            results[i]['comment']['user'] = results[i]['user'];
            results[i]['comment']['stream'] = results[i]['stream'];
            results[i] = results[i]['comment'];
        }
        res.json(outputResult(results));
    });
});

app.get('/v1/comments/user/:userID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var userID = parseInt(req.params.userID);

    var cypher = "MATCH (stream: Stream)<-[:on]-(comment: Comment)<-[:createdComment]-(user :User) WHERE id(user) = {userID} RETURN comment, stream, user ORDER BY comment.date DESC";
    db.query(cypher, {
        'userID': userID
    }, function(err, results) {
        for(var i = 0; i < results.length; i++) {
            results[i]['comment']['user'] = results[i]['user'];
            results[i]['comment']['stream'] = results[i]['stream'];
            results[i] = results[i]['comment'];
        }
        res.json(outputResult(results));
    });
});

app.get('/v1/stats/user/:userID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var userID = parseInt(req.params.userID);
    var items = {};

    var cypher = "MATCH (user: User)-[r: follows]->(:User) WHERE id(user) = {userID} RETURN COUNT(r) AS count";
    db.query(cypher, {
        'userID': userID
    }, function(err, results) {
        items['following'] = results[0]['count'];
        getFollowers();
    });

    function getFollowers() {
        var cypher = "MATCH (:User)-[r: follows]->(user: User) WHERE id(user) = {userID} RETURN COUNT(r) AS count";
        db.query(cypher, {
            'userID': userID
        }, function(err, results) {
            items['followers'] = results[0]['count'];
            getComments();
        });
    }

    function getComments() {
        var cypher = "MATCH (user: User)-[r: createdComment]-() WHERE id(user) = {userID} RETURN COUNT(r) AS count";
        db.query(cypher, {
            'userID': userID
        }, function(err, results) {
            items['comments'] = results[0]['count'];
            res.json(outputResult(items));
        });
    }
});

app.get('/v1/user/:userID/profilePicture', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var userID = parseInt(req.params.userID);
    var file = getUserDir(userID) + 'profilePicture.png';
    isThere(file, function(exists) {
        if (exists) {
            res.sendFile(file);
        } else {
            res.status(404);
            res.end();
        }
    });
});

app.post('/v1/upload/user/profilePicture', urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;

    var fstream = fs.createWriteStream(getUserDir(user.id) + 'profilePicture.png');
    req.pipe(fstream);

    fstream.on('error', function(err) {
        console.log(err);
       res.send(500, err);
    });

    fstream.on('close', function() {
        res.json(outputResult({}));
    });
});


//**********************************************************************
//************************* Live Audio Data ****************************
//**********************************************************************

app.get('/live/:hashed', jsonParser, urlEncodeHandler, function(req, res) {
    var hashed = req.params.hashed;
    var encryptionMethod = 'AES-256-CBC';
    var secret = "JNeKZrihw7WuMx8E5Ou9aiRh2PGDZXAI";
    var iv = secret.substr(0, 16);
    var decryptedMessage = JSON.parse(decrypt(hashed, encryptionMethod, secret, iv));
    if (decryptedMessage) {
        var streamID = parseInt(decryptedMessage.streamID);
        var roomID = streamID + '-audio';

        var xhost = 'http://127.0.0.1:' + process.argv[2] + '/output';
        var xsocket = null;

        res.setHeader("Content-Type", "audio/aac");

        req.on('close', function(){
            if (xsocket) {
                xsocket.disconnect();
            }
        });

        xsocket = xio.connect(xhost);
        var lastSkip = 0;

        xsocket.on('connect', function() {
            xsocket.emit('stream', roomID);
        });

        xsocket.on('streamData', function(data) {
            if ((Date.secNow() - data.time) < 1.0 || (Date.secNow() - lastSkip) < 15.0) {
                res.write(new Buffer(data.data, 'base64'));
            } else {
                lastSkip = Date.secNow();
            }
        });
    }
});

app.post('/v1/playStream/:streamID', jsonParser, urlEncodeHandler, sessionAuth, function(req, res) {
    var user = req.session.user;
    var hashAuth = crypto.randomBytes(64).toString('hex');
    var streamID = parseInt(req.params.streamID);
    var userID = user.id;

    var cypher = "START user = node({userID}) MATCH (user)-[r:listenedTo]->(stream: Stream) WHERE id(stream) = {streamID} RETURN r LIMIT 1";
    var params = {
        'streamID': streamID,
        'userID':  userID
    };
    db.query(cypher, params, function(err, results) {
        if (results.length > 0) {
            db.rel.read(results[0].id, function(err, relationship) {
                relationship.properties.online = true;
                relationship.properties.plays += 1;
                relationship.properties.auth = hashAuth;
                db.rel.update(relationship, function(err) {
                    startStream(relationship);
                });
            });
        } else {
            createRelationship(user);
        }
    });

    function createRelationship(user) {
        db.relate(user, 'listenedTo', streamID, {
            'date': Date.secNow(),
            'online': false,
            'plays': 1,
            'auth': hashAuth
        }, function(err, relationship) {
            startStream(relationship);
        });
    }

    function startStream(relationship) {
        return res.json(outputResult(extend({} , {'auth' : hashAuth}, STM_STREAM_SETTINGS)));
    }
});

app.get('/streamLiveToDevice/:streamID/:userID/:auth', jsonParser, urlEncodeHandler, function(req, res) {
    res.setHeader("Content-Type", "audio/aac");

    req.on('close', function(){
        if (xsocket) {
            xsocket.disconnect();
        }
    });

    var auth = req.params.auth;
    var streamID = parseInt(req.params.streamID);
    var userID = parseInt(req.params.userID);
    var roomID = streamID + '-audio';

    var xhost = 'http://127.0.0.1:' + process.argv[2] + '/output';
    var xsocket = null;

    var cypher = "START user = node({userID}) MATCH (user)-[r:listenedTo]->(stream: Stream) WHERE id(stream) = {streamID} RETURN r LIMIT 1";
    var params = {
        'streamID': streamID,
        'userID':  userID
    };
    db.query(cypher, params, function(err, results) {
        if(results.length > 0) {
            db.rel.read(results[0].id, function(err, relationship) {
                if(relationship.properties.auth != auth) {
                    return res.json(outputError('Invalid session'));
                }

                relationship.properties.online = true;
                db.rel.update(relationship, function(err) {
                    startStream();
                });
            });
        } else {
            res.json(outputError('Invalid session'));
        }
    });

    function startStream() {

        xsocket = xio.connect(xhost);
        var lastSkip = 0;

        xsocket.on('connect', function() {
            xsocket.emit('stream', roomID);
        });

        xsocket.on('streamData', function(data) {
            if ((Date.secNow() - data.time) < 1.0 || (Date.secNow() - lastSkip) < 15.0) {
                res.write(new Buffer(data.data, 'base64'));
            } else {
                lastSkip = Date.secNow();
            }
        });
    }
});

app.get('/streamFromBeginningToDevice/:streamID/:userID/:auth', jsonParser, urlEncodeHandler, function(req, res) {
    res.setHeader("Content-Type", "audio/aac");

    req.on('close', function() {
        if (clientRelationship) {
            clientRelationship.properties.online = false;
            db.rel.update(clientRelationship, function(err) {
                clientRelationship = false;
            });
        }
    });

    var auth = req.params.auth;
    var streamID = parseInt(req.params.streamID);
    var userID = parseInt(req.params.userID);
    var path = '';
    var clientRelationship = false;

    var xhost = 'http://127.0.0.1:' + process.argv[2] + '/output';

    var cypher = "START user = node({userID}) MATCH (user)-[r:listenedTo]->(stream: Stream) WHERE id(stream) = {streamID} RETURN stream, r LIMIT 1";
    var params = {
        'streamID': streamID,
        'userID':  userID
    };
    db.query(cypher, params, function(err, results) {
        if (results.length > 0) {
            db.rel.read(results[0]['r'].id, function(err, relationship) {
                if(relationship.properties.auth != auth) {
                    return res.json(outputError('Invalid session'));
                }

                relationship.properties.online = true;
                db.rel.update(relationship, function(err) {
                    startStream(relationship);
                });
            });
        } else {
            res.json(outputError('Invalid session'));
        }
    });

    function startStream(relationship) {
        clientRelationship = relationship;
        var total = Number.MAX_VALUE;
        var path

        if (req.headers.range) {
            var range = req.headers.range;
            var parts = range.replace(/bytes=/, "").split("-");
            var partialstart = parts[0];
            var partialend = parts[1];

            var start = parseInt(partialstart, 10);
            var end = partialend ? parseInt(partialend, 10) : total-1;
            var chunksize = (end-start)+1;
            console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

            var file = fs.createReadStream(path, {start: start});
            res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'audio/aac' });
            file.pipe(res);
          } else {
            console.log('ALL: ' + total);
            res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'audio/aac' });
            fs.createReadStream(path).pipe(res);
          }
    }
});

app.post('/fetch/:hashed', function(req, res) {
    res.header('Access-Control-Allow-Origin', 'https://stm.io');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.writeHead(200);

    var hashed = req.params.hashed;
    var encryptionMethod = 'AES-256-CBC';
    var secret = "JNeKZrihw7WuMx8E5Ou9aiRh2PGDZXAI";
    var iv = secret.substr(0, 16);
    var decryptedMessage = JSON.parse(decrypt(hashed, encryptionMethod, secret, iv));

    if (decryptedMessage) {
        var arr = {
            'time': Date.secNow()
        };

        /*stm_getNewComments(decryptedMessage.streamID, false, req.body.fetchTime, function(result) {
            arr.comments = result.results;
            stm_streamInfoForID(decryptedMessage.streamID, function(result) {
                delete result['@rid'];
                delete result['@class'];
                delete result['@type']
                delete result['owner'];
                arr.stream = result;
                res.end(JSON.stringify(arr));
            });
        });*/
        res.end(JSON.stringify(arr));
    }
});

app.use(function(req, res) {
    res.status(404);
    return res.json(outputError('404: Method Not Found'));
});

  // Handle 500
app.use(function(error, req, res, next) {
    console.trace(error);
    res.status(500);
    return res.json(outputError('500: Internal Server Error' + error));
 });


commentSocket.on('connection', function(socket) {
    var params = socket.handshake.query;
    if (params.stmHash != "WrfN'/:_f.#8fYh(=RY(LxTDRrU") return socket.disconnect();

    var streamID = parseInt(params.streamID);
    var userID = parseInt(params.userID);
    var roomID = streamID + '-comments';
    var commentUser = null;

    db.read(userID, function(err, user) {
        if (err || !user) {
            return socket.disconnect();
        }
        commentUser = user;

        socket.join(roomID);
        if (!params.owner) {
            var item = {'message': '@' + commentUser.username + ' joined the stream'};
            commentSocket.to(roomID).volatile.emit('item', joinDictWithUser(item, commentUser));
        }
    });

    socket.on('addComment', function(data, callback) {
        var arr = {
            'text': data.text,
            'date': Date.secNow()
        };

        db.save(arr, 'Comment', function(err, comment) {
            if (err) {
                callback(outputError('There was a database error. Oops :('));
            } else {
                commentSocket.to(roomID).volatile.emit('newComment', joinDictWithUser(comment, commentUser));
                relateUserToComment(comment);
            }
        });

        function relateUserToComment(comment) {
            db.relate(commentUser, 'createdComment', comment, {}, function(err, relationship) {
                if(err)console.log(err);
                relateCommentToStream(comment, streamID);
            });
        }

        function relateCommentToStream(comment, stream) {
            db.relate(comment, 'on', stream, {}, function(err, relationship) {
                if(err)console.log(err);
                callback({});
            });
        }
    });
});

//**************** HOST SOCKET ********************\\

hostSocket.on('connection', function(socket) {
    var params = socket.handshake.query;
    if (params.stmHash != "WrfN'/:_f.#8fYh(=RY(LxTDRrU") return socket.disconnect();

    var userID = parseInt(params.userID);
    var streamID = parseInt(params.streamID);
    var streamAlpha = encodeStr(streamID);
    var givenSecurityHash = params.securityHash;
    var roomID = streamID + '-audio';

    var userDir = getUserDir(userID);
    var lockFile = userDir + streamAlpha + '.aac.lock';
    var liveFile = userDir + streamAlpha + '.live';
    var posterFile = userDir + streamAlpha + '.png';
    var recordFile = userDir + streamAlpha + '.aac';
    var isVerified = false;

    //Hosting
    socket.on('dataForStream', function(data, callback) {
        isThere(lockFile, function(exists) {
            if (exists) {
                var securityHash = fs.readFileSync(lockFile, 'utf8');
                if (!isVerified && securityHash == givenSecurityHash) {
                    isVerified = true;
                    socket.join(roomID);
                }

                if (isVerified) {
                    outputSocket.to(roomID).emit('streamData', data);
                    fs.appendFileSync(recordFile, new Buffer(data.data, 'base64'));
                    executeCallback();
                }
            }
        });

        function executeCallback() {
            callback({
                'status': 'ok',
                'bytes': data.data.length,
                'listeners': 0
            });
        }
    });
});

outputSocket.on('connection', function(socket) {
    socket.on('stream', function(data, callback) {
        socket.join(data);
    });
});


function outputError(error) {
    return {
        'success': false,
        'error': error
    };
}

function outputResult(result) {
    return {
        'success': true,
        'result': result
    };
}

function joinDictWithUser(c, u) {
    c['user'] = u;
    return c;
}

//Cryptography
function hashPass(pass) {
    return sha1(md5(pass) + md5(pass.length) + md5(str_rot13(pass)));
}

function sha1(data) {
    var generator = crypto.createHash('sha1');
    generator.update(data);
    return generator.digest('hex');
}

function str_rot13(s) {
    return (s ? s : this).split('').map(function(_) {
        if (!_.match(/[A-za-z]/)) return _;
        c = Math.floor(_.charCodeAt(0) / 97);
        k = (_.toLowerCase().charCodeAt(0) - 83) % 26 || 26;
        return String.fromCharCode(k + ((c == 0) ? 64 : 96));
    }).join('');
}

function random(howMany, chars) {
    chars = chars || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany),
        value = new Array(howMany),
        len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }

    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

function getUserDir(userID) {
    return API_CONTENT_DIRECTORY + '/' + encodeStr(userID) + '/';
}

function encodeStr(str) {
    return hasher.encode(parseInt(str));
}

function userPicsDir(username) {
    return '/home/stream/api/pics_acd9f82099bcae0b0333bee07cac6715/_' + username + '_' + md5(username) + '/';
}

function userDir(username) {
    return '/home/stream/api/uploads_ddecebdea58b5f264d27f1f7909bab74/_' + username + '_' + md5(username) + '/';
}

function sendMessageToAPNS(message, token, prod, type, related) {
    var myDevice = new apn.Device(token);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = "default";
    note.alert = message;

    apnConnection.pushNotification(note, myDevice);
    apnConnectionDev.pushNotification(note, myDevice);
}

function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
}

function determineAuthentication(authorized, req, res, next) {
    if (authorized) {
        return next();
    } else {
        return unauthorized(res);
    }
}

function reauthenticate(req, username, password, valid) {
    db.find({
        'username': username,
        'password': password
    }, 'User', function(err, results) {
        if (!results || results.length == 0) {
            console.log(err);
            return valid(false);
        }

        var user = results[0];
        req.session.user = user;
        return valid(true);
    });
}
