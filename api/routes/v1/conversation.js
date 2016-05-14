var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = require(config.directory.api + '/middlewares')(passThrough);
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var conversationModel = require(config.directory.api + '/models/conversation')(passThrough);

    router.get('/list', middlewares.session, function(req, res) {
        var user = req.session.user;

        conversationModel.fetchConversationsForUserID(user.id).then(function(convos) {
            res.json(helpers.outputResult(convos));
        }).catch(function(err) {
            logger.error(err);
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
