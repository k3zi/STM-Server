var fs = require('fs-promise');
var Promise = require('promise');
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

    exports.relateCommentToStream = function(commentID, streamID) {
        return helpers.checkID(commentID).then(function(commentID) {
            return db.relate(commentID, 'on', streamID, {});
        });
    }

    exports.relateCommentReplyToComment = function(commentID, parentID) {
        return db.relate(commentID, 'replyTo', parentID, {});
    }

    return exports;
}
