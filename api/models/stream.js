var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

createStreamSession = function(streamID, userID) {
    return db.relate(userID, 'listenedTo', streamID, {'date': helpers.now(), 'online': true, 'plays': 1, 'auth': helpers.randomStr(32)});
}

ensureStreamDirectoryExists = function(stream) {
    return new Promise(function (fulfill, reject) {
        fs.ensureDir(getStreamDir(stream.id), function(err) {
            if (err) reject(err);
            else fulfill(stream);
        });
    });
}

getStreamDir = function(streamID) {
    return config.directory.stream_content + '/' + helpers.encodeStr(streamID) + '/';
}

incrementRelationship = function(relationship) {
    relationship.properties.online = true;
    relationship.properties.plays += 1;
    relationship.properties.auth = helpers.randomStr(32);

    return db.rel.update(relationship).then(function() {
        return relationship;
    });
}

setSessionOnline = function(relationship) {
    relationship.properties.online = true;

    return db.rel.update(relationship).then(function() {
        return relationship;
    });
}

streamLastOnline = function(streamID) {
    var streamAlpha = helpers.encodeStr(streamID);
    var streamDir = getStreamDir(streamID);
    var liveFile = streamDir + streamAlpha + '.live';

    return new Promise(function (fulfill, reject) {
        fs.readFile(liveFile, 'utf8', function(err, contents) {
            if (!err) {
                var date = parseInt(contents);
                var diff = helpers.now() - date;

                return fulfill(diff);
            } else {
                return fulfill(helpers.now());
            }
        });
    });
}

parseLiveStream = function(item) {
    var stream = item['stream'];
    if (!stream) return undefined;

    return streamLastOnline(stream.id).then(function(lastOnline) {
        if (lastOnline < 30) {
            stream['user'] = item['user'];
            return stream;
        } else {
            return undefined;
        }
    });
}

module.exports = function(passThrough) {
    var exports = {};

    exports.create = function(data) {
        return new Promise(function (fulfill, reject) {
            if (!data.name || data.name.length < 4) {
                return reject('Stream name needs to be at least 4 characters');
            }

            if (!data.description) {
                return reject('Missing description');
            }

            return fulfill(data);
        }).then(function(data) {
            return db.save(data, 'Stream');
        }).then(ensureStreamDirectoryExists);
    }

    exports.delete = function(streamID, userID) {
        return helpers.checkID(streamID).then(function(streamID) {
            var cypher = "START x = node({userID})"
            + " MATCH x-[:createdStream]->(stream)"
            + " WHERE id(stream) = {streamID}"
            + " DETACH DELETE stream";

            return db.query(cypher, {'userID': userID, 'streamID': streamID});
        });
    }

    exports.fetchActiveFollowed = function(userID) {
        var cypher = "MATCH (stream: Stream)<-[:createdStream]-(owner: User)<-[:follows]-(user)"
        + " WHERE id(user) = {userID}"
        + " RETURN stream, owner AS user";

        return db.query(cypher, {'userID': userID}).then(function(results) {
            return Promise.all(results.map(parseLiveStream));
        }).then(function(streams) {
            return streams.filter(function(n){ return n != undefined });
        });
    }

    exports.fetchCommentsForStreamID = function(streamID) {
        return helpers.checkID(streamID).then(function(streamID) {
            var cypher = "START stream = node({streamID})"
            + " MATCH (comment: Comment)-[:on]->(stream)"
            + " MATCH (user: User)-[:createdComment]->(comment)"
            + " RETURN comment, user"
            + " ORDER BY comment.date DESC"
            + " LIMIT 50";
            return db.query(cypher, {'streamID': streamID}).then(function(results) {
                for (var i in results) {
                    results[i].comment.user = results[i].user;
                    results[i] = results[i].comment;
                }

                return results;
            });
        });
    }

    exports.fetchStreamsForUserID = function(userID) {
        return helpers.checkID(userID).then(function(userID) {
            var cypher = "START x = node({userID}) MATCH x-[:createdStream]->(stream) RETURN stream";
            return db.query(cypher, {'userID': userID});
        });
    }

    exports.fetchStreamWithID = function(streamID, userID) {
        return helpers.checkID(streamID).then(function(streamID) {
            var cypher = "START x = node({userID})"
            + " MATCH x-[:createdStream]->(stream)"
            + " WHERE id(stream) = {streamID}"
            + " RETURN stream";
            return db.query(cypher, {'userID': userID, 'streamID': streamID}).then(function(results) {
                if (results.length > 0) {
                    return results[0];
                } else {
                    return Promise.reject("Couldn't find stream");
                }
            }).then(ensureStreamDirectoryExists);
        });
    }

    exports.find = function(params) {
        return new Promise(function (fulfill, reject) {
            if (params.length == 0) reject('no paramaters sent');

            fulfill(params);
        }).then(function(params) {
            return db.find(params, 'User');
        }).then(ensureUserDirectoryExists);
    }

    exports.findStreamSession = function(streamID, userID) {
        return helpers.checkID(streamID).then(function(streamID) {
            var cypher = "START user = node({userID})"
            + " MATCH (user)-[r:listenedTo]->(stream: Stream)"
            + " WHERE id(stream) = {streamID}"
            + " RETURN r"
            + " LIMIT 1";
            return db.query(cypher,  {'streamID': streamID, 'userID':  userID}).then(function(results) {
                if (results.length > 0) {
                    return db.rel.read(results[0].id).then(setSessionOnline);
                }
            });
        });
    }

    exports.findOrCreateStreamSession = function(streamID, userID) {
        return exports.findStreamSession(streamID, userID).then(function(relationship) {
            if (relationship) {
                return incrementRelationship(relationship);
            } else {
                return createStreamSession(streamID, userID);
            }
        });
    }

    exports.getFeaturedItems = function() {
        var cypher = "MATCH (stream: Stream {featured: true})<-[:createdStream]-(user: User) RETURN stream, user LIMIT 10";

        return db.query(cypher, {}).then(function(results) {
            for (var i in results) {
                results[i]['stream']['user'] = results[i]['user'];
                results[i] = results[i]['stream'];
            }

            return results;
        });
    }

    exports.incrementStream = function(streamID) {
        return new Promise(function (fulfill, reject) {
            var streamAlpha = helpers.encodeStr(streamID);
            var streamDir = getStreamDir(streamID);
            var recordFile = streamDir + streamAlpha + '.aac';
            var lockFile = streamDir + streamAlpha + '.aac.lock';

            helpers.isThere(recordFile, function(exists) {
                if (exists) fs.unlinkSync(recordFile);

                helpers.isThere(lockFile, function(exists) {
                    if (exists) fs.unlinkSync(lockFile);

                    var securityHash = helpers.randomStr(10);
                    fs.closeSync(fs.openSync(lockFile, 'w'));
                    fs.appendFileSync(lockFile, securityHash);
                    fulfill(securityHash);
                });
            });
        });
    }

    exports.save = function(stream) {
        return db.save(stream);
    }

    exports.search = function(query, currentUserID) {
        var currentUserID = helpers.fixID(currentUserID);
        var likeString = config.db.constructLike(query);

        var cypher = "MATCH (stream: Stream)"
        + " WHERE stream.name " + likeString + " OR stream.description " + likeString
        + " RETURN stream"
        + " LIMIT 5";
        return db.query(cypher, {}).then(function (results) {
            for (var i in results) {
                results[i]['_type'] = 'STMStream';
            }

            return results;
        });
    }

    exports.updatePropertyForStream = function(property, value, streamID, userID) {
        return helpers.checkID(streamID).then(function(streamID) {
            var cypher = "START x = node({userID})"
            + " MATCH x-[:createdStream]->(stream: Stream)"
            + " WHERE id(stream) = {streamID}"
            + " SET stream." + property + " = {value}"
            + " RETURN stream";

            return db.query(cypher, {'userID': userID, 'streamID': streamID, 'value': value}).then(function (results) {
                if (results.length > 0) {
                    return results[0];
                } else {
                    return Promise.reject('You do not own this stream');
                }
            });
        });
    }

    exports.ensureStreamDirectoryExists = ensureStreamDirectoryExists;
    exports.getStreamDir = getStreamDir;
    exports.streamLastOnline = streamLastOnline;

    return exports;
}
