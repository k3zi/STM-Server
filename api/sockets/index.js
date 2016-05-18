var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

getStreamDir = function(streamID) {
    return config.directory.stream_content + '/' + helpers.encodeStr(streamID) + '/';
}

module.exports = function(passThrough) {
    var commentSocket = passThrough.commentSocket;
    var hostSocket = passThrough.hostSocket;
    var outputSocket = passThrough.outputSocket;
    var commentModel = require(config.directory.api + '/models/comment')(passThrough);
    var relationships = require(config.directory.api + '/models/relationships')(passThrough)

    commentSocket.on('connection', function(socket) {
        var params = socket.handshake.query;
        if (params.stmHash != config.app.stream.auth) return socket.disconnect();

        var streamID = parseInt(params.streamID);
        var userID = parseInt(params.userID);
        var roomID = streamID + '-comments';
        var user = null;

        db.read(userID).then(function(userX) {
            user = userX;

            socket.join(roomID);
            if (!params.owner) {
                var item = {'message': '@' + commentUser.username + ' joined the stream'};
                item.user = user;

                commentSocket.to(roomID).volatile.emit('item', item);
            }
        }).catch(function(err) {
            socket.disconnect();
        });

        socket.on('addComment', function(data, callback) {
            commentModel.create(data.text).then(function(comment) {
                comment.user = user;
                commentSocket.to(roomID).volatile.emit('newComment', comment);

                var p1 = relationships.relateUserToComment(user.id, comment.id);
                var p2 = relationships.relateCommentToStream(comment.id, streamID);
                var p3 = helpers.sendMentionsForComment(comment, user);

                return Promise.all([p1, p2, p3]);
            }).then(function() {
                callback(helpers.outputResult({}));
            }).catch(function(err) {
            	callback(helpers.outputError(err));
            });
        });

    });

    //**************** HOST SOCKET ********************\\

    hostSocket.on('connection', function(socket) {
        var params = socket.handshake.query;
        if (params.stmHash != "WrfN'/:_f.#8fYh(=RY(LxTDRrU") return socket.disconnect();

        var userID = parseInt(params.userID);
        var streamID = parseInt(params.streamID);
        var streamAlpha = helpers.encodeStr(streamID);
        var givenSecurityHash = params.securityHash;
        var roomID = streamID + '-audio';
        var commentRoomID = streamID + '-comments';

        var streamDir = getStreamDir(streamID);
        var lockFile = streamDir + streamAlpha + '.aac.lock';
        var liveFile = streamDir + streamAlpha + '.live';
        var metaFile = streamDir + streamAlpha + '.meta';
        var recordFile = streamDir + streamAlpha + '.aac';
        var isVerified = false;

        socket.on('updateMeta', function(data, callback) {
            var wstream = fs.createWriteStream(metaFile);
            wstream.write(JSON.stringify(data));
            wstream.end();
            commentSocket.to(commentRoomID).volatile.emit('didUpdateMetadata', {});
            callback({});
        });

        socket.on('updateHex', function(data, callback) {
            commentSocket.to(commentRoomID).volatile.emit('didUpdateHex', data);
            callback({});
        });

        //Hosting
        socket.on('dataForStream', function(data, callback) {
            helpers.isThere(lockFile, function(exists) {
                if (!exists) return;
                
                if (!isVerified) {
                    var securityHash = fs.readFileSync(lockFile, 'utf8');
                    if  (securityHash == givenSecurityHash) {
                        isVerified = true;
                        socket.join(roomID);
                    }
                }

                if (isVerified) {
                    outputSocket.to(roomID).emit('streamData', data);
                    fs.appendFile(recordFile, new Buffer(data.data, 'base64')).then(function() {
                        var wstream = fs.createWriteStream(liveFile);
                        wstream.write(Date.secNow().toString());
                        wstream.end();
                        executeCallback();
                    });
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
}
