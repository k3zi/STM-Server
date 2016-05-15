var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;
var _ = require('lodash');

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var conversationModel = require(config.directory.api + '/models/conversation')(passThrough);

    router.post('/create', middlewares.session, function(req, res) {
        var user = req.session.user;
        var userList = req.body.users;

        if (!userList || !_.isArrayLikeObject(userList)) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        conversationModel.create(userList).then(function(convo) {
            res.json(helpers.outputResult(convo));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/list', middlewares.session, function(req, res) {
        var user = req.session.user;

        conversationModel.fetchConversationsForUserID(user.id).then(function(convos) {
            res.json(helpers.outputResult(convos));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
