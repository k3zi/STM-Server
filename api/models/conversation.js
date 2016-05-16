var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

module.exports = function(passThrough) {
    var exports = {};

    connectUserToConvo = function(userID, convoID) {
        var cypher = "MATCH (convo: Conversation), (user: User)"
        + " WHERE id(convo) = {convoID} AND id(user) = {userID}"
        + " CREATE UNIQUE (user)-[r: joined {read: 0}]->(convo) RETURN r";

        return db.query(cypher, {'convoID': convoID, 'userID': userID});
    }

    fetchConversation = function(convoID) {
        var cypher = "MATCH (convo: Conversation)"
        + " WHERE id(convo) = {convoID}"
        + " OPTIONAL MATCH (users: User)-[:joined]->(convo)"
        + " RETURN convo, COLLECT(users) AS users"

        return db.query(cypher, {'convoID': convoID}).then(function(results) {
            if (results.length > 0) {
                var result = results[0];
                result.convo.users = result.users;
                result.convo.lastMessage = null;
                return result.convo;
            }
        });
    }

    exports.create = function(userList) {
        userList = _.uniq(userList);

        return db.save({name: ''}, 'Conversation').then(function(convo) {
            return Promise.all(userList.map(function(userID) {
                return connectUserToConvo(userID, convo.id);
            })).then(function() {
                return fetchConversation(convo.id);
            });
        });
    }

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

    exports.fetchConversationMessages = function(comvoID, userID) {
        return helpers.checkID(comvoID).then(function(convoID) {
            var cypher = "MATCH (currentUser: User)-[joinInfo:joined]->(convo: Conversation)<-[:on]-(message: Message)<-[:createdMessage]-(user: User)"
            + " WHERE id(convo) = {convoID} AND id(currentUser) = {userID}"
            + " SET joinInfo.read = {date}"
            + " RETURN message, user"
            + " ORDER BY message.date ASC";

            return db.query(cypher, {'convoID': convoID, 'userID': userID, 'date': helpers.now()}).then(function() {
                for (var i in results) {
                    results[i].message.user = results[i].user;
                    results[i] = results[i].message;
                }

                return results;
            });
        });
    }

    return exports;
}
