var express = require('express');
var config = require('config');

var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');
var commentModel = require(config.directory.api + '/models/comment');

var router = express.Router();

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

router.get('/:commentID/like', middlewares.session, function (req, res) {
    var user = req.session.user;
    var commentID = req.params.commentID;
    if (!commentID) {
        return res.json(helpers.outputError('Missing Paramater'));
    }

    commentModel.likeComment(commentID, user.id).then(function (result) {
        if (result) {
            helpers.sendMessageToAPNS('@' + user.username + ' liked: ' + result.comment.text, result.user.apnsToken, result.user.badge);
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

router.get('/:commentID/repost', middlewares.session, function (req, res) {
    var user = req.session.user;
    var commentID = req.params.commentID;
    if (!commentID) {
        return res.json(helpers.outputError('Missing Paramater'));
    }

    commentModel.repostComment(commentID, user.id).then(function (result) {
        if (result) {
            helpers.sendMessageToAPNS('@' + user.username + ' reposted: ' + result.comment.text, result.user.apnsToken, result.user.badge);
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

module.exports = router;
