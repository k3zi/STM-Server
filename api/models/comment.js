var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

parseComment = function(item) {
    var comment = item['comment'];
    comment['user'] = item['user'];
    comment['stream'] = item['stream'];
    comment['didLike'] = (item['didLike'] ? true : false);
    comment['likes'] = item['likes'];
    comment['didRepost'] = (item['didRepost'] ? true : false);
    comment['reposts'] = item['reposts'];
    comment['reposter'] = item['reposter'];
    return comment;
}

exports.fetchRepliesForComment = function(commentID, currentUserID) {
    var currentUserID = (typeof currentUserID == 'string' ? parseInt(currentUserID) : currentUserID) || -1;

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

exports.parseComment = parseComment;
