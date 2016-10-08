var fs = require('fs-promise');
var Promise = require('bluebird');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');
var _ = require('lodash');

module.exports = function(passThrough) {
    var exports = {};

    exports.relateUserToComment = function(userID, commentID) {
        return helpers.checkID(commentID).then(function(commentID) {
            return db.relate(userID, 'createdComment', commentID, {'date': helpers.now()});
        });
    }

    exports.relateUserToMessage = function(userID, messageID) {
        return helpers.checkID(messageID).then(function(messageID) {
            return db.relate(userID, 'createdMessage', messageID, {'date': helpers.now()});
        });
    }

    exports.relateUserToStream = function(userID, streamID) {
        return helpers.checkID(streamID).then(function(streamID) {
            return db.relate(userID, 'createdStream', streamID, {'date': helpers.now()});
        });
    }

    exports.relateCommentToStream = function(commentID, streamID) {
        return helpers.checkID(commentID).then(function(commentID) {
            return db.relate(commentID, 'on', streamID, {});
        });
    }

    exports.relateCommentReplyToComment = function(commentID, parentID) {
        return db.relate(commentID, 'replyTo', parentID, {});
    }

    exports.relateMessageToConvo = function(messageID, convoID) {
        return db.relate(messageID, 'on', convoID, {});
    }

    return exports;
}
