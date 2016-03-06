//************** IMPORTANT INCLUDES **************\\\
var http = require('http');
var express = require('express');

var sio = require('socket.io');
var xio = require('socket.io-client');
var redis = require('socket.io-redis');

var seraph = require("seraph");
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

var regularAuth = function(req, res, next) {
    var auth = basicAuth(req);
    var authorized = auth && auth.name && auth.pass && auth.name === API_AUTH_USER && auth.pass === API_AUTH_PASS;
    return determineAuthentication(authorized, req, res, next);
};

var sessionAuth = function(req, res, next) {
    var auth = basicAuth(req);
    var authorized = auth && auth.name && auth.pass && auth.name === API_AUTH_USER && auth.pass === API_AUTH_PASS && req.session.user;
    return determineAuthentication(authorized, req, res, next);
};

var decrypt = function(encryptedMessage, encryptionMethod, secret, iv) {
    var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
    return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
};

//TODO: Handle errors
d = (new domain()).create();
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
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(cookieParser());
app.use(session({
    secret: 'pTb8zDt8drE69B949bHx',
    expires: new Date(Date.now() + 3600000 * 24),
    resave: true,
    saveUninitialized: true
}));

var server = (new http()).Server(app);
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

//Hashing
var hasher = new Hashids(STM_CONFIG.hashSalt, STM_CONFIG.hashMinLength, STM_CONFIG.hashChars);

//****************** REGULAR AUTH METHODS ********************\\

app.post('/v1/createAccount', regularAuth, function(req, res) {
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


app.post('/v1/signIn', regularAuth, function(req, res) {
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

app.post('/v1/authenticate', regularAuth, function(req, res) {
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

app.post('/v1/updateAPNS', sessionAuth, function(req, res) {
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

app.get('/v1/streams/user/:userID', sessionAuth, function(req, res) {
    var data = req.body;
    var user = req.session.user;
    var userID = req.params.userID < 1 ? user.id : req.params.userID;

    var cypher = "START x = node({userID}) MATCH x -[:createdStream]->(stream) RETURN stream";
    db.query(cypher, {
        'userID': userID
    }, function(err, results) {
        res.json(outputResult(results));
    });
});

app.get('/v1/delete/stream/:streamID', sessionAuth, function(req, res) {
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

app.post('/v1/createStream', sessionAuth, function(req, res) {
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

app.post('/v1/continueStream/:streamID', sessionAuth, function(req, res) {
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

app.post('/v1/stream/:streamID/comment', sessionAuth, function(req, res) {
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

app.get('/v1/stream/:streamID/comments', sessionAuth, function(req, res) {
    var streamID = parseInt(req.params.streamID);

    var cypher = "START stream = node({streamID}) MATCH (comment: Comment) -[:on]-> (stream) MATCH (user: User) -[:createdComment]-> (comment) RETURN comment, user ORDER BY comment.date DESC LIMIT 50";
    var params = {
        'streamID': streamID
    };
    db.query(cypher, params, function(err, results) {
        for(var i = 0; i < results.length; i++) {
            results[i] = joinCommentWithUser(results[i]['comment'], results[i]['user']);
        }
        return res.json(outputResult(results));
    });
});

//**********************************************************************
//**************************** Dashboard *******************************
//**********************************************************************

app.get('/v1/dashboard', sessionAuth, function(req, res) {
    var user = req.session.user;
    var items = [];

    var cypher = "MATCH (stream: Stream) RETURN stream LIMIT 10";
    var params = {
    };
    db.query(cypher, params, function(err, results1) {
        items.push({'name': 'Active Streams', 'items': results1});
        return res.json(outputResult(items));
    });
});

//**********************************************************************
//************************* Live Audio Data ****************************
//**********************************************************************

app.get('/live/:hashed', function(req, res) {
    res.setHeader("Content-Type", "audio/aac");

    req.on('close', function(){
        if (clientRelationship) {
            clientRelationship.properties.online = false;
            db.rel.update(clientRelationship, function(err) {
                clientRelationship = false;
            });
        }

        if (xsocket) {
            xsocket.disconnect();
        }
    });

    var hashed = req.params.hashed;
    var encryptionMethod = 'AES-256-CBC';
    var secret = "JNeKZrihw7WuMx8E5Ou9aiRh2PGDZXAI";
    var iv = secret.substr(0, 16);
    var decryptedMessage = JSON.parse(decrypt(hashed, encryptionMethod, secret, iv));
    var streamID = parseInt(decryptedMessage.streamID);
    var roomID = streamID + '-audio';
    var clientRelationship = false;

    var xhost = 'http://127.0.0.1:' + process.argv[2] + '/output';
    var xsocket = null;

    if (decryptedMessage) {
        var arr = {
            'ipAddress': req.ip
        };

        db.find(arr, 'Anonymous', function (err, users) {
            if(users.length > 0) {
                var user = users[0];
                var userID = user.id;

                var cypher = "START user = node({userID}) MATCH (user)-[r:listenedTo]->(stream: Stream) WHERE id(stream) = {streamID} RETURN r LIMIT 1";
                var params = {
                    'streamID': streamID,
                    'userID':  userID
                };
                db.query(cypher, params, function(err, results) {
                    if(results.length > 0) {
                        db.rel.read(results[0].id, function(err, relationship) {
                            relationship.properties.online = true;
                            relationship.properties.plays += 1;
                            db.rel.update(relationship, function(err) {
                                startStream(relationship);
                            });
                        });
                    } else {
                        createRelationship(user);
                    }
                });
            } else {
                db.save(arr, 'Anonymous', function(err, user) {
                    createRelationship(user);
                });
            }
        });

        function createRelationship(user) {
            db.relate(user, 'listenedTo', streamID, {
                'date': Date.secNow(),
                'online': true,
                'plays': 1
            }, function(err, relationship) {
                startStream(relationship);
            });
        }

        function startStream(relationship) {
            clientRelationship = relationship;

            xsocket = xio.connect(xhost);
            var lastSkip = 0;
            var lastSave = Date.secNow();

            xsocket.on('connect', function() {
                xsocket.emit('stream', roomID);
            });

            xsocket.on('streamData', function(data) {
                if (clientRelationship != false) {
                    if((Date.secNow() - data.time) < 1.0 || (Date.secNow() - lastSkip) < 15.0) {
                        if ((Date.secNow() - lastSave) > 30) {
                            relationship.properties.date = Date.secNow();
                            relationship.properties.online = true;
                            db.rel.update(relationship, function(err) {
                                res.write(new Buffer(data.data, 'base64'));
                            });
                            lastSave = Date.secNow();
                        } else {
                            res.write(new Buffer(data.data, 'base64'));
                        }
                    } else {
                        lastSkip = Date.secNow();
                    }
                }
            });
        }
    }
});

app.post('/v1/playStream/:streamID', sessionAuth, function(req, res) {
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
        if(results.length > 0) {
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

app.get('/streamLiveToDevice/:streamID/:userID/:auth', function(req, res) {
    res.setHeader("Content-Type", "audio/aac");

    req.on('close', function(){
        if (clientRelationship) {
            clientRelationship.properties.online = false;
            db.rel.update(clientRelationship, function(err) {
                clientRelationship = false;
            });
        }

        if (xsocket) {
            xsocket.disconnect();
        }
    });

    var auth = req.params.auth;
    var streamID = parseInt(req.params.streamID);
    var userID = parseInt(req.params.userID);
    var roomID = streamID + '-audio';
    var clientRelationship = false;

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
                    startStream(relationship);
                });
            });
        } else {
            res.json(outputError('Invalid session'));
        }
    });

    function startStream(relationship) {
        clientRelationship = relationship;

        xsocket = xio.connect(xhost);
        var lastSkip = 0;
        var lastSave = Date.secNow();

        xsocket.on('connect', function() {
            xsocket.emit('stream', roomID);
        });

        xsocket.on('streamData', function(data) {
            if (clientRelationship != false) {
                if((Date.secNow() - data.time) < 1.0 || (Date.secNow() - lastSkip) < 15.0) {
                    if ((Date.secNow() - lastSave) > 30) {
                        relationship.properties.date = Date.secNow();
                        relationship.properties.online = true;
                        db.rel.update(relationship, function(err) {
                            res.write(new Buffer(data.data, 'base64'));
                        });
                        lastSave = Date.secNow();
                    } else {
                        res.write(new Buffer(data.data, 'base64'));
                    }
                } else {
                    lastSkip = Date.secNow();
                }
            }
        });
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
    res.status(500);
    return res.json(outputError('500: Internal Server Error'));
 });


commentSocket.on('connection', function(socket) {
    var params = socket.handshake.query;
    if (params.stmHash != "WrfN'/:_f.#8fYh(=RY(LxTDRrU") return socket.disconnect();

    var streamID = params.streamID;
    var userID = params.userID;
    var roomID = streamID + '-comments';
    var commentUser = null;

    db.read(userID, function(err, user) {
        if (err || !user) {
            return socket.disconnect();
        }
        commentUser = user;
        socket.join(roomID);
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
                commentSocket.to(roomID).volatile.emit('newComment', joinCommentWithUser(comment, commentUser));
                callback({});
            });
        }
    });
});

//**************** HOST SOCKET ********************\\

hostSocket.on('connection', function(socket) {
    var params = socket.handshake.query;
    if (params.stmHash != "WrfN'/:_f.#8fYh(=RY(LxTDRrU") return socket.disconnect();

    var userID = params.userID;
    var streamID = parseInt(params.streamID);
    var streamAlpha = encodeStr(streamID);
    var givenSecurityHash = params.securityHash;
    var roomID = streamID + '-audio';

    var userDir = getUserDir(userID);
    var lockFile = userDir + streamAlpha + '.aac.lock';
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
                    db.read(streamID, function(err, stream) {
                        if (!stream) return;
                        stream.lastPacket = Date.secNow()
                        if (data.songName) stream.songName = data.songName;
                        if (data.songArtist) stream.songArtist = data.songArtist;
                        if (data.songAlbum) stream.songAlbum = data.songAlbum;

                        db.save(stream, function(err, stream) {
                            if (data.poster) {
                                isThere(posterFile, function(exists) {
                                    if (exists) fs.unlinkSync(posterFile);
                                    fs.closeSync(fs.openSync(posterFile, 'w'));
                                    fs.appendFileSync(posterFile, new Buffer(data.poster, 'base64'));
                                    executeCallback();
                                });
                            } else {
                                executeCallback();
                            }
                        });
                    });
                }
            }
        });

        function executeCallback() {
            var cypher = "START stream = node({streamID}) MATCH (user) -[r:listenedTo]-> (stream) WHERE r.online RETURN count(r) AS count";
            db.query(cypher, {
                'streamID': streamID
            }, function(err, results) {
                callback({
                    'status': 'ok',
                    'bytes': data.data.length,
                    'listeners': results[0]['count']
                });
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

function joinCommentWithUser(c, u) {
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
    return API_CONTENT_DIRECTORY + '/user/' + encodeStr(userID) + '/';
}

function encodeStr(str) {
    return hasher.encode(parseInt(str));
}





/*****************************************************/







/*

app.get('/getProfilePic/:username', function(req, res) {
    res.setHeader("Content-Type", "image/png");

    isThere(userPicsDir(req.params.username) + '140x140.png', function(exists) {
        if (exists) {
            var imageData = fs.readFileSync(userPicsDir(req.params.username) + '140x140.png');
            res.send(imageData);
        } else {
            var imageData = fs.readFileSync("/home/stream/api/default-avatar.png");
            res.send(imageData);
        }
    });
});

app.get('/artwork/:username/:streamAlphaID', function(req, res) {
    res.setHeader("Content-Type", "image/png");

    isThere(userDir(req.params.username) + req.params.streamAlphaID + '.png', function(exists) {
        if (exists) {
            console.log(userDir(req.params.username) + req.params.streamAlphaID + '.png');
            var imageData = fs.readFileSync(userDir(req.params.username) + req.params.streamAlphaID + '.png');
            res.send(imageData);
        } else {
            var imageData = fs.readFileSync("/home/stream/public_html/assets/defaultArtwork.png");
            res.send(imageData);
        }
    });
});

app.get('/device/:hashed', function(req, res) {
    res.setHeader("Content-Type", "audio/aac");
    res.writeHead(200);

    var hashed = req.params.hashed;
    hashed = new Buffer(hashed, 'base64');
    var decryptedMessage = JSON.parse(hashed);

    if (decryptedMessage) {
        var xio = require('socket.io-client'),
            xsocket = xio.connect('https://localhost:3232/output');

        xsocket.on('connect', function() {
            xsocket.emit('stream', decryptedMessage.streamID);
        });

        xsocket.on('streamData', function(data) {
            if ((Date.secNow() - data.time) < 1)
                res.write(new Buffer(data.data, 'base64'));
        });
    }
});


//Streaming


app.post('/api/continueStream/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var streamAlphaID = data.streamAlphaID;
    if (data.local) return res.json({
        'status': 'ok',
        'id': streamAlphaID
    });

    var userID = userInfo['@rid'];
    var streamID = '#13:' + hasher.decode(streamAlphaID);
    var aacFile = userDir + streamAlphaID + '.aac';
    var lockFile = aacFile + '.lock';
    isThere(lockFile, function(exists) {
        if (exists) fs.unlinkSync(lockFile);

        var securityHash = random(10);
        fs.closeSync(fs.openSync(lockFile, 'w'));
        fs.appendFileSync(lockFile, securityHash);

        stm_streamInfoForID(streamID, function(stream) {
            stm_allFollowers(userID, function(followers) {
                for (var i = 0; i < followers.length; i++) {
                    if (followers[i]['token'] && followers[i]['token'].length == 64) {
                        sendMessageToAPNS(userInfo['name'] + ' continued streaming ' + stream['name'], followers[i]['token']);
                    }
                }

                res.json({
                    'status': 'ok',
                    'id': streamAlphaID,
                    'stream': stream,
                    'securityHash': securityHash
                });
            });
        });
    });
});

//Stream Comments
app.post('/api/addComment/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var message = data.message;
    var streamAlphaID = data.streamAlphaID;
    var streamID = '#13:' + hashids.decode(streamAlphaID);
    stm_addComment(userID, userInfo, message, streamID, function(arr) {
        res.json(arr);
    });
});

app.post('/api/addReply/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var message = data.message;
    var streamID = data.streamID;
    var replyID = data.replyID;
    stm_addReply(userID, userInfo, message, streamID, replyID, function(arr) {
        res.json(arr);
    });
});

app.post('/api/getOldComments/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var olderThan = data.olderThan;
    var streamAlphaID = data.streamAlphaID;
    var streamID = '#13:' + hashids.decode(streamAlphaID);
    stm_getOldComments(streamID, userInfo['@rid'], olderThan, function(arr) {
        res.json(arr);
    });
});

app.post('/api/getNewComments/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var lastFetch = data.lastFetch;
    var streamAlphaID = data.streamAlphaID;
    var streamID = '#13:' + hashids.decode(streamAlphaID);
    stm_getNewComments(streamID, userInfo['@rid'], lastFetch, function(arr) {
        res.json(arr);
    });
});

app.post('/api/getReplys/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var streamID = data.streamID;
    var replyID = data.replyID;
    var lastFetch = data.lastFetch ? data.lastFetch : 0;
    stm_getReplys(streamID, userInfo['@rid'], replyID, lastFetch, function(arr) {
        res.json(arr);
    });
});

//Hearts & RePosts
app.post('/api/heartComment/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var commentID = data.commentID;

    db.select('count(*)').from('CommentLikeConnect').where({
        'outV().@rid': userID,
        'inV().@rid': commentID
    }).scalar().then(function(total) {
        if (total > 0) {
            res.json({
                'status': 'ok'
            });
        } else {
            db.create('EDGE', 'CommentLikeConnect').from(userID).to(commentID).set({
                'date': Date.secNow()
            }).one().then(function(edge) {
                res.json({
                    'status': 'ok'
                });
            });
        }
    });
});

app.post('/api/unheartComment/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var commentID = data.commentID;

    db.select('count(*)').from('CommentLikeConnect').where({
        'outV().@rid': userID,
        'inV().@rid': commentID
    }).scalar().then(function(total) {
        if (total > 0) {
            db.delete('EDGE', 'CommentLikeConnect').from(userID).to(commentID).scalar().then(function(count) {
                res.json({
                    'status': 'ok'
                });
            });
        } else {
            res.json({
                'status': 'ok'
            });
        }
    });
});

app.post('/api/repostComment/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var commentID = data.commentID;

    db.select('count(*)').from('CommentRepostConnect').where({
        'outV().@rid': userID,
        'inV().@rid': commentID
    }).scalar().then(function(total) {
        if (total > 0) {
            res.json({
                'status': 'ok'
            });
        } else {
            db.create('EDGE', 'CommentRepostConnect').from(userID).to(commentID).set({
                'date': Date.secNow()
            }).one().then(function(edge) {
                res.json({
                    'status': 'ok'
                });
            });
        }
    });
});

app.post('/api/unrepostComment/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var commentID = data.commentID;

    db.select('count(*)').from('CommentRepostConnect').where({
        'outV().@rid': userID,
        'inV().@rid': commentID
    }).scalar().then(function(total) {
        if (total > 0) {
            db.delete('EDGE', 'CommentRepostConnect').from(userID).to(commentID).scalar().then(function(count) {
                res.json({
                    'status': 'ok'
                });
            });
        } else {
            res.json({
                'status': 'ok'
            });
        }
    });
});

//Dashboard
app.post('/api/updateDasboard/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    db.query("SELECT *, owner.* as owner_, out('TagConnect')[string] AS tags FROM (SELECT expand(out('FollowConnect').out('StreamConnect')) FROM " + userInfo['@rid'] + ")").then(function(results) {
        filterOutObjects(results);
        var rowsActive = [];
        var rowsInactive = [];

        for (var i = 0; i < results.length; i++) {
            if (results[i]['last_packet'] && results[i]['last_packet'] > (Date.secNow() - 30)) {
                results[i]['online'] = 1;
                rowsActive.push(results[i]);
            } else {
                rowsInactive.push(results[i]);
            }
        }

        var query = "";
        var getPopular = false;
        if (getPopular) {
            var arr = io.sockets.adapter.rooms;
            var roomIDs = [];
            console.log(arr);
            if (arr.length > 0) {
                arr.sort(function(a, b) {
                    return b.length - a.length;
                });

                var l = 0;
                for (var k in arr) {
                    if (l >= 5) break;

                    roomIDs.push(k);
                    l++;
                }
            }
            console.log(roomIDs);

            query = "SELECT *, owner.* as owner_, out('TagConnect')[string] AS tags FROM () ORDER BY last_packet DESC LIMIT 5";
        } else {
            query = "SELECT *, owner.* as owner_, out('TagConnect')[string] AS tags FROM STMStream ORDER BY last_packet DESC LIMIT 5";
        }

        db.query(query).then(function(rowsFeatured) {
            filterOutObjects(rowsFeatured);
            res.json({
                'status': 'ok',
                'results': {
                    'Featured Streams': rowsFeatured,
                    'Active Streams': rowsActive,
                    'Inactive Streams': rowsInactive
                }
            });
        });
    });
});


app.post('/api/updateEvents/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    if (data.lastUpdate > 0) {
        db.query(eventSelection(userInfo['@rid']) + " WHERE @class = 'STMComment' AND date > :lastUpdate ORDER BY date DESC", {
            'params': {
                'rid': userInfo['@rid'],
                'lastUpdate': data.lastUpdate
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    } else {
        db.query(eventSelection(userInfo['@rid']) + " WHERE @class = 'STMComment' ORDER BY date DESC LIMIT 25", {
            'params': {
                'rid': userInfo['@rid']
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    }
});

app.post('/api/getOlderEvents/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    db.query(eventSelection(userInfo['@rid']) + " WHERE @class = 'STMComment' AND date < :olderThan ORDER BY date DESC LIMIT 25", {
        'params': {
            'rid': userInfo['@rid'],
            'olderThan': data.olderThan
        }
    }).then(function(results) {
        filterOutObjects(results);
        res.json({
            'status': 'ok',
            'results': results
        });
    });
});

app.post('/api/userTimeline/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    if (data.lastUpdate > 0) {
        db.query(timelineSelection(data.userID) + " WHERE @class = 'STMComment' AND date > :lastUpdate ORDER BY date DESC", {
            'params': {
                'rid': userInfo['@rid'],
                'lastUpdate': data.lastUpdate
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    } else {
        db.query(timelineSelection(data.userID) + " WHERE @class = 'STMComment' ORDER BY date DESC LIMIT 25", {
            'params': {
                'rid': userInfo['@rid']
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    }
});

app.post('/api/getOlderUserTimeline/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    db.query(timelineSelection(data.userID) + " WHERE @class = 'STMComment' AND date < :olderThan ORDER BY date DESC LIMIT 25", {
        'params': {
            'rid': userInfo['@rid'],
            'olderThan': data.olderThan
        }
    }).then(function(results) {
        filterOutObjects(results);
        res.json({
            'status': 'ok',
            'results': results
        });
    });
});

app.post('/api/userLikes/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    if (data.lastUpdate > 0) {
        db.query(likeSelection(data.userID) + " AND date > :lastUpdate ORDER BY date DESC", {
            'params': {
                'rid': userInfo['@rid'],
                'lastUpdate': data.lastUpdate
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    } else {
        db.query(likeSelection(data.userID) + " ORDER BY date DESC LIMIT 25" + fetchPlan, {
            'params': {
                'rid': userInfo['@rid']
            }
        }).then(function(results) {
            filterOutObjects(results);
            results.reverse();
            res.json({
                'status': 'ok',
                'results': results
            });
        });
    }
});

app.post('/api/getOlderUserLikes/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;
    db.query(likeSelection(data.userID) + " AND date < :olderThan ORDER BY date DESC LIMIT 25", {
        'params': {
            'rid': userInfo['@rid'],
            'olderThan': data.olderThan
        }
    }).then(function(results) {
        filterOutObjects(results);
        res.json({
            'status': 'ok',
            'results': results
        });
    });
});

//Search
app.post('/api/autocomplete/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    db.query("SELECT *, owner.* as owner_, user.* as user_, stream.* as stream_ FROM V WHERE (@class = 'STMUser' OR @class = 'STMStream' OR @class = 'STMComment') AND any() LIKE '" + data.q + "%' LIMIT 10").then(function(results) {
        filterOutObjects(results);
        res.json({
            'status': 'ok',
            'results': results
        });
    });
});

//Followers
app.post('/api/getUserFollowersInfo/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var otherUserID = data.userID;

    stm_userFollowersInfo(otherUserID, userID, function(arr) {
        res.json(arr);
    });
});

app.post('/api/getFollowList/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = data.userID;
    var arr = {
        'status': 'ok'
    };
    stm_allFollowers(userID, function(followers) {
        arr.followers = followers;
        stm_allFollowing(userID, function(following) {
            arr.following = following;

            res.json(arr);
        });
    });
});

app.post('/api/followUser/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var otherUserID = data.userID;

    stm_follow(userID, otherUserID, function(arr) {
        res.json(arr);
    });
});

app.post('/api/unfollowUser/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var userID = userInfo['@rid'];
    var otherUserID = data.userID;

    stm_unfollow(userID, otherUserID, function(arr) {
        res.json(arr);
    });
});

app.post('/api/saveUser/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;
    var pictureFile = userPicsDir(userInfo.username) + '140x140.png';
    console.log(pictureFile);

    var userID = userInfo['@rid'];
    if (data.avatar) {
        var avatar = new Buffer(data.avatar, 'base64');
        isThere(pictureFile, function(exists) {
            if (exists) fs.unlinkSync(pictureFile);
            fs.closeSync(fs.openSync(pictureFile, 'w'));
            fs.appendFileSync(pictureFile, avatar);
            db.update('STMUser').set({
                'name': data.name,
                'description': data.description
            }).where({
                '@rid': userID
            }).scalar().then(function(total) {
                res.json({
                    'status': 'ok'
                });
            });
        });
    } else {
        db.update('STMUser').set({
            'name': data.name,
            'description': data.description
        }).where({
            '@rid': userID
        }).scalar().then(function(total) {
            res.json({
                'status': 'ok'
            });
        });
    }
});

app.post('/api/changePassword/:md5check', requireSessionAuth, function(req, res) {
    var data = req.body;
    var userInfo = req.session.user;
    var userDir = req.session.userDir;

    var oldPassword = hashPass(data.oldPassword);
    var newPassowrd = hashPass(data.newPassowrd);
    var userID = userInfo['@rid'];

    db.select().from('STMUser').where({
        'username': userInfo.username,
        'password': oldPassword
    }).limit(1).one().then(function(user) {
        if (user) {
            db.update('STMUser').set({
                'password': newPassowrd
            }).where({
                '@rid': userID
            }).scalar().then(function(total) {
                res.json({
                    'status': 'ok',
                    'hash': newPassowrd
                });
                userInfo.passowrd = newPassowrd;
            });
        } else {
            res.json({
                'status': 'error',
                'error': 'Incorrect password'
            });
        }
    });
});

*/

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
