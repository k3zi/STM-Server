/*jslint node:true */
/*jslint nomen: true */

var fs = require('fs-promise');
var Promise = require('bluebird');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

parseComment = function (item) {
    var comment = item.comment;
    comment['user'] = item['user'];
    comment['stream'] = item['stream'];
    comment['didLike'] = (item['didLike'] ? true : false);
    comment['likes'] = item['likes'];
    comment['didRepost'] = (item['didRepost'] ? true : false);
    comment['reposts'] = item['reposts'];
    comment['reposter'] = item['reposter'];
    return comment;
}

module.exports = function(passThrough) {
    var exports = {};

    exports.create = function(text) {
        return new Promise(function (fulfill, reject) {
            if (!text || text.length == 0) return reject('Invalid text');

            fulfill(text);
        }).then(function(text) {
            return db.save({'text': text, 'date': helpers.now()}, 'Comment');
        });
    }

    exports.fetchRepliesForComment = function(commentID, currentUserID) {
        var currentUserID = helpers.fixID(currentUserID);

        return helpers.checkID(commentID).then(function(commentID) {
            var cypher = "MATCH (user: User)-[:createdComment]->(reply: Comment)-[:replyTo*]->(comment: Comment)-[:on]->(stream: Stream)"
            + " WHERE id(comment) = {commentID}"
            + " OPTIONAL MATCH (sessionUser)"
            + " WHERE id(sessionUser) = {sessionUserID}"
            + " OPTIONAL MATCH (sessionUser)-[didLike: likes]->(reply)"
            + " OPTIONAL MATCH ()-[likes: likes]->(reply)"
            + " OPTIONAL MATCH (sessionUser)-[didRepost: reposted]->(reply)"
            + " OPTIONAL MATCH ()-[reposts: reposted]->(reply)"
            + " RETURN reply AS comment, didLike, COUNT(likes) AS likes, COUNT(reposts) AS reposts, didRepost, stream, user"
            + " ORDER BY comment.date ASC";

            return db.query(cypher, {'commentID': commentID, 'sessionUserID': currentUserID}).then(function(results) {
                return Promise.all(results.map(parseComment));
            });
        });
    }

    exports.likeComment = function(commentID, currentUserID) {
        return helpers.checkID(commentID).then(function(commentID) {
            var cypher = "MATCH (fromUser: User), (comment: Comment)<-[:createdComment]-(user: User)"
            + " WHERE id(fromUser) = {fromID} AND id(comment) = {commentID}"
            + " CREATE UNIQUE (fromUser)-[r: likes]->(comment)"
            + " SET r.date = {date}"
            + " SET user.badge = user.badge + 1"
            + " RETURN user, comment";

            return db.query(cypher, {'fromID': currentUserID, 'commentID': commentID, 'date': helpers.now()}).then(function(results) {
                if (results.length > 0) {
                    return results[0];
                }
            });
        });
    }

    exports.unlikeComment = function(commentID, currentUserID) {
        return helpers.checkID(commentID).then(function(commentID) {
            var cypher = "MATCH (fromUser: User)-[r:likes]->(comment: Comment)"
            + " WHERE id(fromUser) = {fromID} AND id(comment) = {commentID}"
            + " DELETE r";

            return db.query(cypher, {'fromID': currentUserID, 'commentID': commentID});
        });
    }

    exports.repostComment = function(commentID, currentUserID) {
        return helpers.checkID(commentID).then(function(commentID) {
            var cypher = "MATCH (fromUser: User), (comment: Comment)<-[:createdComment]-(user: User)"
            + " WHERE id(fromUser) = {fromID} AND id(comment) = {commentID}"
            + " CREATE UNIQUE (fromUser)-[r: reposted]->(comment)"
            + " SET r.date = {date}"
            + " SET user.badge = user.badge + 1"
            + " RETURN user, comment";

            return db.query(cypher, {'fromID': currentUserID, 'commentID': commentID, 'date': helpers.now()}).then(function(results) {
                if (results.length > 0) {
                    return results[0];
                }
            });
        });
    }

    exports.unrepostComment = function(commentID, currentUserID) {
        return helpers.checkID(commentID).then(function(commentID) {
            var cypher = "MATCH (fromUser: User)-[r:reposted]->(comment: Comment)"
            + " WHERE id(fromUser) = {fromID} AND id(comment) = {commentID}"
            + " DELETE r";

            return db.query(cypher, {'fromID': currentUserID, 'commentID': commentID});
        });
    }

    exports.parseComment = parseComment;

    return exports;
}
