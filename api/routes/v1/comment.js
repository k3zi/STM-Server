var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var commentModel = require(config.directory.api + '/models/comment')(passThrough);
    var relationships = require(config.directory.api + '/models/relationships')(passThrough);

    router.get('/:commentID/like', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Comment ID'));
        }

        commentModel.likeComment(commentID, user.id).then(function (result) {
            if (result) {
                helpers.sendMessageToAPNS('@' + user.username + ' liked: "' + result.comment.text + '"', result.user.apnsToken, result.user.badge);
            }

            res.json(helpers.outputResult({}));
        }).catch(next);
    });

    router.get('/:commentID/unlike', middlewares.session, function (req, res, next) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        commentModel.unlikeComment(commentID, user.id).then(function (result) {
            res.json(helpers.outputResult({}));
        }).catch(next);
    });

    router.get('/:commentID/replys', middlewares.auth, function(req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Comment ID'));
        }

        commentModel.fetchRepliesForComment(commentID, (user ? user.id : -1)).then(function(results) {
            res.json(helpers.outputResult(results));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/:commentID/reply', middlewares.session, function(req, res) {
        var user = req.session.user;

        var commentID = req.params.commentID;
        var streamID = req.body.streamID;
        var text = req.body.text;

        if (!commentID && !streamID && !text) {
            return res.json(helpers.outputError('Missing Paramaters'));
        }

        commentModel.create(text).then(function(comment) {
            var roomID = streamID + '-comments';
            comment.user = user;
            passThrough.commentSocket.to(roomID).volatile.emit('newComment', comment);

            var p1 = relationships.relateUserToComment(user.id, comment.id);
            var p2 = relationships.relateCommentToStream(comment.id, streamID);
            var p3 = relationships.relateCommentReplyToComment(comment.id, commentID);
            var p4 = helpers.sendMentionsForComment(comment, user);

            return Promise.all([p1, p2, p3, p4]);
        }).then(function() {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:commentID/repost', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Comment ID'));
        }

        commentModel.repostComment(commentID, user.id).then(function (result) {
            if (result) {
                helpers.sendMessageToAPNS('@' + user.username + ' reposted: "' + result.comment.text + '"', result.user.apnsToken, result.user.badge);
            }

            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:commentID/unrepost', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater', false, req));
        }

        commentModel.unrepostComment(commentID, user.id).then(function (result) {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
