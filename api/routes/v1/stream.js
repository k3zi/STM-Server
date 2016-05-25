var fs = require('fs-promise');
var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var relationships = require(config.directory.api + '/models/relationships')(passThrough);

    router.post('/create', middlewares.session, function(req, res, next) {
        var user = req.session.user;

        var data = {
            'name': req.body.name,
            'type': req.body.type || 0,
            'description': req.body.description,
            'private': false
        };

        streamModel.create(data).then(function(stream) {
            return relationships.relateUserToStream(user.id, stream.id).then(function() {
                return streamModel.incrementStream(stream.id);
            }).then(function(securityHash) {
                stream.securityHash = securityHash;
                stream.streamAlphaID = helpers.encodeStr(stream.id);
                return helpers.sendNotificationsForStreamContinue(stream, user);
            }).then(function() {
                return streamModel.save(stream);
            });
        }).then(function(stream) {
            res.json(helpers.outputResult(stream));
        }).catch(next);
    });

    router.get('/:streamID/comments', middlewares.auth, function(req, res, next) {
        var streamID = req.params.streamID;

        streamModel.fetchCommentsForStreamID(streamID).then(function(comments) {
            res.json(helpers.outputResult(comments));
        }).catch(next);
    });

    router.post('/:streamID/continue', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        var streamAlpha = helpers.encodeStr(streamID);

        streamModel.fetchStreamWithID(streamID, user.id).then(function(stream) {
            return streamModel.incrementStream(stream.id).then(function(securityHash) {
                stream.securityHash = securityHash;
                return helpers.sendNotificationsForStreamContinue(stream, user);
            }).then(function() {
                return streamModel.save(stream);
            });
        }).then(function(stream) {
            res.json(helpers.outputResult(stream));
        }).catch(next);
    });

    router.get('/:streamID/delete', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        if (!streamID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        streamModel.delete(streamID, user.id).then(function() {
            res.json(helpers.outputResult({}));
        }).catch(next);
    });

    router.get('/:streamID/isOnline', middlewares.auth, function(req, res, next) {
        var streamID = req.params.streamID;

        if (!streamID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        helpers.checkID(streamID).then(streamModel.streamLastOnline).then(function(lastOnline) {
            if (lastOnline < 10) {
                res.json(helpers.outputResult({'online': 1}));
            } else if (lastOnline < 45) {
                res.json(helpers.outputResult({'online': 2}));
            } else {
                res.json(helpers.outputResult({'online': 0}));
            }
        }).catch(next);
    });

    router.get('/:streamID/meta', middlewares.auth, function(req, res, next) {
        var streamID = req.params.streamID;

        helpers.checkID(streamID).then(function(streamID) {
            var streamAlpha = helpers.encodeStr(streamID);
            var streamDir = streamModel.getStreamDir(streamID);
            var metaFile = streamDir + streamAlpha + '.meta';

            fs.readFile(metaFile, 'utf8', function(err, contents) {
                if (err) {
                    res.json(helpers.outputResult({}));
                } else {
                    var json = JSON.parse(contents);
                    res.json(helpers.outputResult(json));
                }
            });
        }).catch(next);
    });

    router.get('/:streamID/startSession', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        if (!streamID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        streamModel.findOrCreateStreamSession(streamID, user.id).then(function(session) {
            res.json(helpers.outputResult(helpers.extend({} , session.properties, config.app.stream)));
        }).catch(next);
    });

    router.get('/:streamID/picture', middlewares.auth, function(req, res, next) {
        var streamID = req.params.streamID;
        helpers.checkID(streamID).then(function(streamID) {
            var file = streamModel.getStreamDir(streamID) + 'picture.png';
            helpers.isThere(file, function(exists) {
                if (exists) {
                    res.sendFile(file);
                } else {
                    res.status(404);
                    res.end();
                }
            });
        }).catch(next);
    });

    router.get('/:streamID/playStream/:userID/:auth', middlewares.raw, function(req, res, next) {
        var streamID = req.params.streamID;
        var userID = req.params.userID;
        var auth = req.params.auth;

        var xsocket = false;

        if (!streamID || !userID || !auth) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        req.on('close', function(){
            if (xsocket) {
                xsocket.disconnect();
            }
        });

        helpers.checkID(userID).then(function(userID) {
            streamModel.findStreamSession(streamID, userID).then(function(session) {
                if (!session) return Promise.reject('No session found');
                startStream();
            }).catch(next);
        });

        function startStream() {
            var roomID = streamID + '-audio';
            var xhost = 'http://127.0.0.1:' + passThrough.port + '/output';
            res.setHeader("Content-Type", "audio/aac");

            xsocket = require('socket.io-client').connect(xhost);

            xsocket.on('connect', function() {
                xsocket.emit('stream', roomID);
            });

            xsocket.on('streamData', function(data) {
                res.write(new Buffer(data.data, 'base64'));
            });
        }
    });

    router.post('/:streamID/update/:property', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var property = req.params.property;
        var value = req.body.value;
        var streamID = req.params.streamID;

        if (!property || !value || !streamID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        streamModel.updatePropertyForStream(property, value, streamID, user.id).then(function(result) {
            res.json(helpers.outputResult(result));
        }).catch(next);
    });

    router.post('/:streamID/upload/picture', middlewares.uploadSession, function(req, res, next) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        helpers.checkID(streamID).then(function(streamID) {
            return streamModel.fetchStreamWithID(streamID, user.id).then(function(stream) {
                var fstream = fs.createWriteStream(streamModel.getStreamDir(stream.id) + 'picture.png');
                req.pipe(fstream);

                fstream.on('error', function(err) {
                    console.log(err);
                   res.send(500, err);
                });

                fstream.on('finish', function() {
                    res.json(helpers.outputResult({}));
                });
            });
        }).catch(next);
    });

    return router;
}
