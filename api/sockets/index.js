var fs = require('fs-promise');
var Promise = require('bluebird');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var mysql = require('mysql');
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
        if (params.stmHash != config.app.stream.socketAuth) {
            logger.error('>> comment: User connected with incorrect hash');
            return socket.disconnect();
        }
        logger.info('>> comment: User connected with correct hash');

        var streamID = parseInt(params.streamID);
        var userID = parseInt(params.userID);
        var roomID = streamID + '-comments';
        var user = null;

        db.read(userID).then(function(userX) {
            user = userX;

            socket.join(roomID);
            if (!params.owner) {
                var item = {'message': '@' + user.username + ' joined the stream'};
                item.user = user;
                commentSocket.to(roomID).volatile.emit('item', item);
                logger.info('>> comment: User joined room: ' + roomID);
            }
        }).catch(function(err) {
            logger.error(err);
            socket.disconnect();
        });

        socket.on('addComment', function(data, callback) {
            logger.info('>> comment: User added comment: ' + data.text);
            commentModel.create(data.text).then(function(comment) {
                logger.info('>> comment: Created comment: ' + comment);
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
        if (params.stmHash != config.app.stream.socketAuth) return socket.disconnect();
        logger.info('>> host: User connected with correct hash');

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

            var imageData = data.image;
            var imageFile = "";

            function updateDB() {
              var meta = {
                meta_stream_id: streamID,
                meta_album: data.album,
                meta_artist: data.artist,
                meta_title: data.title,
                meta_image_file: imageFile,
                meta_date: helpers.now()
              };

              passThrough.mysql.query('INSERT INTO stream_meta SET ?', meta).then(function (result) {
                callback(result);
              });
            }

            if (imageData.length > 0) {
              imageFile = helpers.md5(imageData) + "_" + helpers.sha1(imageData) + "_" + imageData.length + ".jpg";
              var finalImageFile = config.directory.shared_content + "/images/" + imageFile;
              helpers.isThere(finalImageFile, function(exists) {
                if (!exists) {
                  var imageStream = fs.createWriteStream(finalImageFile);
                  imageStream.write(Buffer.from(imageData, 'base64'));
                  imageStream.end();
                }

                updateDB();
              });
            } else {
              updateDB();
            }
        });

        socket.on('updateHex', function(data, callback) {
            commentSocket.to(commentRoomID).volatile.emit('didUpdateHex', data);
            callback({});
        });

        //Hosting
        socket.on('dataForStream', function(data, callback) {
            helpers.isThere(lockFile, function(exists) {
                if (!exists) return callback({'status': 'err', 'error': 'Lock file does not exist.', 'bytes': 0, 'listeners': 0});;

                if (!isVerified) {
                    var securityHash = fs.readFileSync(lockFile, 'utf8');
                    if  (securityHash == givenSecurityHash) {
                        isVerified = true;
                        socket.join(roomID);
                    } else {
                        callback({'status': 'err', 'error': 'Could not verify stream source.', 'bytes': 0, 'listeners': 0});
                    }
                }

                if (isVerified) {
                    outputSocket.to(roomID).emit('streamData', data);
                    fs.appendFile(recordFile, new Buffer(data.data, 'base64'), (err) => {
                        if (err) return callback({'status': 'err', 'error': 'Could not append stream data.', 'bytes': 0, 'listeners': 0});

                        var wstream = fs.createWriteStream(liveFile);
                        wstream.write(helpers.now().toString());
                        wstream.end();
                        callback({'status': 'ok', 'bytes': data.data.length, 'listeners': 0});
                    });
                }
            });
        });
    });

    outputSocket.on('connection', function(socket) {
        socket.on('stream', function(data, callback) {
            socket.join(data);
        });
    });
}
