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

ensureStreamDirectoryExists = function(stream) {
    return new Promise(function (fulfill, reject) {
        fs.ensureDir(getStreamDir(stream.id), function(err) {
            if (err) reject(err);
            else fulfill(user);
        });
    });
}

parseLiveStream = function(item) {
    return new Promise(function (fulfill, reject) {
        var stream = item['stream'];
        var streamAlpha = helpers.encodeStr(stream.id);
        var streamDir = getStreamDir(stream.id);
        var liveFile = streamDir + streamAlpha + '.live';

        fs.readFile(liveFile, 'utf8', function(err, contents) {
            if (!err) {
                var date = parseInt(contents);
                var diff = _.now() - date;

                if (diff < 30) {
                    stream['user'] = item['user'];
                    return fulfill(stream);
                }
            }

            fulfill(undefined);
        });
    });
}

exports.fetchActiveFollowed = function(userID) {
    var cypher = "MATCH (stream: Stream)<-[:createdStream]-(owner: User)<-[:follows]-(user)"
    + " WHERE id(user) = {userID}"
    + " RETURN stream, owner AS user";
    var params = { 'userID': userID };

    return db.query(cypher, params).then(function(results) {
        return Promise.all(results.map(parseLiveStream));
    }).then(function(streams) {
        return streams.filter(function(n){ return n != undefined });
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

exports.fetchStreamsForUserID = function(userID) {
    return new Promise(function (fulfill, reject) {
        var userID = parseInt(userID) || -1;
        if (userID == -1) return reject('Invalid user ID');
        fulfill(userID);
    }).then(function(userID) {
        var cypher = "START x = node({userID}) MATCH x-[:createdStream]->(stream) RETURN stream";
        return db.query(cypher, {'userID': userID});
    });
}
