var express = require('express');
var config = require('config');

var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');
var conversationModel = require(config.directory.api + '/models/conversation');

var router = express.Router();

router.get('/list', middlewares.session, function(req, res) {
    var user = req.session.user;

    conversationModel.fetchConversationsForUserID(user.id).then(function(convos) {
        res.json(helpers.outputResult(convos));
    }).catch(function(err) {
        logger.error(err);
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
