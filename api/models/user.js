var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');

getUserDir = function(userID) {
    return config.directory.user_content + '/' + helpers.encodeStr(userID) + '/';
}

ensureUserDirectoryExists = function(user) {
    return new Promise(function (fulfill, reject) {
        fs.ensureDir(getUserDir(user.id), function(err) {
            if (err) reject(err);
            else fulfill(user);
        });
    });
}

exports.create = function(username, password, password, unverifiedEmail, displayName) {
    return new Promise(function (fulfill, reject) {
        if (username.length == 0 || password.length == 0 || unverifiedEmail.length == 0 || displayName.length == 0) {
            return reject('Missing Paramater');
        }

        var user = {
            username: username,
            password: password,
            unverifiedEmail: unverifiedEmail,
            displayName: displayName,
            badge: 0
        }

        fulfill(user);
    }).then(function(user) {
        return db.save(user, 'User');
    }).then(ensureUserDirectoryExists);
}

exports.find = function(params) {
    return new Promise(function (fulfill, reject) {
        if (params.length == 0) reject('no paramaters sent');

        fulfill(params);
    }).then(function(params) {
        return db.find(params, 'User');
    }).then(ensureUserDirectoryExists);
}

exports.fetchUserTimeline = function(userID) {
    var cypher = "MATCH (stream: Stream)<-[:on]-(comment: Comment)<-[:createdComment|reposted]-(postingUser:User)<-[:follows*0..1]-(user :User)"
    + " WHERE id(user) = {userID}"
    + " WITH DISTINCT comment, stream, user"
    + " MATCH (commentUser)-[:createdComment]->(comment)"
    + " OPTIONAL MATCH (comment)<-[r1:reposted]-(reposter:User)<-[:follows*0..1]-(user)"
    + " WITH comment, stream, user, commentUser, HEAD(COLLECT(reposter)) AS reposter, HEAD(COLLECT(r1)) AS r1"
    + " OPTIONAL MATCH (user)-[didLike: likes]->(comment)"
    + " OPTIONAL MATCH ()-[likes: likes]->(comment)"
    + " OPTIONAL MATCH (user)-[didRepost: reposted]->(comment)"
    + " OPTIONAL MATCH ()-[reposts: reposted]->(comment)"
    + " OPTIONAL MATCH (user)-[doesFollow: follows]->(commentUser)"
    + " RETURN comment, reposter, COUNT(DISTINCT likes) AS likes, COUNT(DISTINCT reposts) AS reposts, didRepost, didLike, stream, commentUser AS user"
    + ", CASE WHEN (doesFollow.date IS NOT NULL OR id(user) = id(commentUser)) THEN comment.date ELSE r1.date END AS sortDate"
    + " ORDER BY sortDate DESC";

    return db.query(cypher, {'userID': userID}).then(function(results) {
        for(var i in results) {
            results[i]['comment']['user'] = results[i]['user'];
            results[i]['comment']['stream'] = results[i]['stream'];
            results[i]['comment']['didLike'] = (results[i]['didLike'] ? true : false);
            results[i]['comment']['likes'] = results[i]['likes'];
            results[i]['comment']['didRepost'] = (results[i]['didRepost'] ? true : false);
            results[i]['comment']['reposts'] = results[i]['reposts'];
            results[i]['comment']['reposter'] = results[i]['reposter'];
            results[i] = results[i]['comment'];
        }

        return results;
    });
}
