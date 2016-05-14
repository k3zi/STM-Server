var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = require(config.directory.api + '/middlewares')(passThrough);
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var commentModel = require(config.directory.api + '/models/comment')(passThrough);

    router.get('/:commentID/like', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        commentModel.likeComment(commentID, user.id).then(function (result) {
            if (result) {
                helpers.sendMessageToAPNS('@' + user.username + ' liked: "' + result.comment.text + '"', result.user.apnsToken, result.user.badge);
            }

            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:commentID/unlike', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        commentModel.unlikeComment(commentID, user.id).then(function (result) {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:commentID/replys', middlewares.auth, function(req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater'));
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
            return res.json(helpers.outputError('Missing Paramater'));
        }

        commentModel.replyToCommentOnStream(text, commentID, streamID, user.id).then(function() {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:commentID/repost', middlewares.session, function (req, res) {
        var user = req.session.user;
        var commentID = req.params.commentID;
        if (!commentID) {
            return res.json(helpers.outputError('Missing Paramater'));
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
            return res.json(helpers.outputError('Missing Paramater'));
        }

        commentModel.unrepostComment(commentID, user.id).then(function (result) {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
