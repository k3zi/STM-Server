var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

exports.fetchConversationsForUserID = function(userID) {
    var cypher = "MATCH (user: User)-[joinInfo:joined]->(convo: Conversation)<-[:on]-(messages: Message)"
    + " WHERE id(user) = {userID}"
    + " OPTIONAL MATCH (users: User)-[:joined]->(convo)"
    + " OPTIONAL MATCH (convo)<-[:on]-(unreadMessages: Message)"
    + " WHERE unreadMessages.date > joinInfo.read"
    + " WITH DISTINCT convo, user, users, messages, COUNT(unreadMessages) AS unreadCount"
    + " ORDER BY messages.date DESC"
    + " RETURN convo, HEAD(COLLECT(messages)) AS lastMessage, COLLECT(DISTINCT users) AS users, unreadCount"
    + " ORDER BY lastMessage.date DESC";

    return db.query(cypher, {'userID': userID}).then(function(results) {
        for (var i in results) {
            results[i]['convo']['users'] = results[i]['users'];
            results[i]['convo']['lastMessage'] = results[i]['lastMessage'];
            results[i]['convo']['unreadCount'] = results[i]['unreadCount'];
            results[i] = results[i]['convo'];
        }

        return results;
    });
}
