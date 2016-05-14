var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');

var commentModel = require(config.directory.api + '/models/comment');

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

exports.countUserFollowing = function(userID) {
    var cypher = "MATCH (user: User)-[r: follows]->(:User)"
    + " WHERE id(user) = {userID}"
    + " RETURN COUNT(r) AS count";
    return db.query(cypher, {'userID': userID}).then(function(result) {
        return (result.length > 0 ? result[0]['count'] : 0);
    });
}

exports.countUserFollowers = function(userID) {
    var cypher = "MATCH (:User)-[r: follows]->(user: User)"
    + " WHERE id(user) = {userID}"
    + " RETURN COUNT(r) AS count";
    return db.query(cypher, {'userID': userID}).then(function(result) {
        return (result.length > 0 ? result[0]['count'] : 0);
    });
}

exports.countUserComments = function(userID) {
    var cypher = "MATCH (user: User)-[r: createdComment]-()"
    + " WHERE id(user) = {userID}"
    + " RETURN COUNT(r) AS count";
    return db.query(cypher, {'userID': userID}).then(function(result) {
        return (result.length > 0 ? result[0]['count'] : 0);
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

exports.fetchUserLikes = function(userID, currentUserID) {
    var currentUserID = (typeof currentUserID == 'string' ? parseInt(currentUserID) : currentUserID) || -1;

    return helpers.checkID(userID).then(function(userID) {
        var cypher = "MATCH (stream: Stream)<-[:on]-(comment: Comment)<-[like:likes]-(user :User)"
        + " WHERE id(user) = {userID}"
        + " MATCH (commentUser)-[:createdComment]->(comment)"
        + " OPTIONAL MATCH (sessionUser)"
        + " WHERE id(sessionUser) = {sessionUserID}"
        + " OPTIONAL MATCH (sessionUser)-[didLike: likes]->(comment)"
        + " OPTIONAL MATCH (sessionUser)-[didRepost: reposted]->(comment)"
        + " OPTIONAL MATCH ()-[likes: likes]->(comment)"
        + " OPTIONAL MATCH ()-[reposts: reposted]->(comment)"
        + " RETURN comment, didLike, like, COUNT(DISTINCT likes) AS likes, COUNT(DISTINCT reposts) AS reposts, didRepost, stream, commentUser AS user"
        + " ORDER BY like.date DESC";

        return db.query(cypher, {'userID': userID, 'sessionUserID': currentUserID}).then(function(results) {
            return Promise.all(results.map(commentModel.parseComment));
        });
    });
}

exports.fetchUserSelectiveTimeline = function(userID, currentUserID) {
    var currentUserID = (typeof currentUserID == 'string' ? parseInt(currentUserID) : currentUserID) || -1;

    return helpers.checkID(userID).then(function(userID) {
        var cypher = "MATCH (stream: Stream)<-[:on]-(comment: Comment)<-[:createdComment|reposted]-(user :User)"
        + " WHERE id(user) = {userID}"
        + " MATCH (commentUser)-[:createdComment]->(comment)"
        + " OPTIONAL MATCH (sessionUser)"
        + " WHERE id(sessionUser) = {sessionUserID}"
        + " OPTIONAL MATCH (sessionUser)-[didLike: likes]->(comment)"
        + " OPTIONAL MATCH (sessionUser)-[didRepost: reposted]->(comment)"
        + " OPTIONAL MATCH ()-[likes: likes]->(comment)"
        + " OPTIONAL MATCH ()-[reposts: reposted]->(comment)"
        + " RETURN comment, didLike, COUNT(DISTINCT likes) AS likes, COUNT(DISTINCT reposts) AS reposts, didRepost, stream, commentUser AS user"
        + ", CASE WHEN didRepost.date IS NULL THEN comment.date ELSE didRepost.date END AS sortDate"
        + " ORDER BY sortDate DESC";

        return db.query(cypher, {'userID': userID, 'sessionUserID': currentUserID}).then(function(results) {
            return Promise.all(results.map(commentModel.parseComment));
        });
    });
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
        return Promise.all(results.map(commentModel.parseComment));
    });
}

exports.followUser = function(currentUserID, userID) {
    return helpers.checkID(userID).then(function(userID) {
        var cypher = "MATCH (fromUser: User), (toUser: User)"
        + " WHERE id(fromUser) = {fromID} AND id(toUser) = {toID}"
        + " CREATE UNIQUE (fromUser)-[r: follows]->(toUser)"
        + " SET r.date = {date}, toUser.badge = toUser.badge + 1"
        + " RETURN toUser";

        return db.query(cypher, {'fromID': currentUserID, 'toID': userID, 'date': helpers.now()}).then(function(results) {
            if (results.length > 0) {
                return results[0];
            }
        });
    });
}

exports.search = function(query, currentUserID) {
    var currentUserID = (typeof currentUserID == 'string' ? parseInt(currentUserID) : currentUserID) || -1;
    var likeString = config.db.constructLike(query);

    var cypher = "MATCH (user: User)"
    + " WHERE user.displayName " + likeString + " OR user.username " + likeString
    + " OPTIONAL MATCH (thisUser)-[isFollowing:follows]->(user)"
    + " WHERE id(thisUser) = {userID}"
    + " RETURN user, isFollowing"
    + " LIMIT 5";
    return db.query(cypher, {'userID': currentUserID}).then(function (results) {
        for (var i in results) {
            var user = results[i]['user'];
            user['_type'] = 'STMUser';
            user['isFollowing'] = (results[i]['isFollowing'] ? true : false);
            results[i] = user;
        }

        return results;
    });
}

exports.unfollowUser = function(currentUserID, userID) {
    return helpers.checkID(userID).then(function(userID) {
        var cypher = "MATCH (fromUser: User)-[r:follows]->(toUser: User)"
        + " WHERE id(fromUser) = {fromID} AND id(toUser) = {toID}"
        + " DELETE r";

        return db.query(cypher, {'fromID': currentUserID, 'toID': userID});
    });
}

exports.updateAPNSForUser = function(token, userID) {
    var cypher = "START x = node({userID})"
    + " OPTIONAL MATCH (user: User {apnsToken: {token1}})"
    + " WHERE id(user) <> id(x)"
    + " SET x.apnsToken = {token2}, user.apnsToken = ''"
    + " RETURN x";
    return db.query(cypher, {'userID': userID, 'token1': token, 'token2': token}).then(function (results) {
        if (results.length > 0) {
            return results[0];
        }
    });
}

exports.updatePropertyForUser = function(property, value, userID) {
    var cypher = "START x = node({userID})"
    + " SET x." + property + " = {value}"
    + " RETURN x";
    return db.query(cypher, {'userID': userID, 'value': value}).then(function (results) {
        if (results.length > 0) {
            return results[0];
        }
    });
}

exports.userIsFollowingUser = function(userID1, userID2) {
    var cypher = "MATCH (user1)-[r: follows]->(user2)"
    + " WHERE id(user1) = {userID1} AND id(user2) = {userID2}"
    + " RETURN COUNT(r) AS isFollowing";
    return db.query(cypher, {'userID1': userID1, 'userID2': userID2}).then(function(result) {
        var isFollowing = (result.length > 0 ? result[0]['isFollowing'] : 0);
        return isFollowing > 0 ? true : false;
    });
}
