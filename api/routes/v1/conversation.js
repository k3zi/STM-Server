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
    var relationships = require(config.directory.api + '/models/relationships')(passThrough);

    router.post('/create', middlewares.session, function(req, res) {
        var user = req.session.user;
        var userList = req.body.users;

        if (!userList || !_.isArrayLikeObject(userList)) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userList.push(user.id);
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

    router.get('/:convoID/list', middlewares.session, function(req, res) {
        var user = req.session.user;
        var convoID = req.params.convoID;

        conversationModel.fetchConversationMessages(convoID, user.id).then(function(messages) {
            res.json(helpers.outputResult(messages));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/:convoID/send', middlewares.session, function(req, res) {
        var user = req.session.user;
        var convoID = req.params.convoID;
        var text = req.body.text;

        conversationModel.createMessage(text).then(function(message) {

            var p1 = relationships.relateUserToMessage(user.id, message.id);
            var p2 = relationships.relateMessageToConvo(message.id, convoID);
            var p3 = helpers.sendNotificationsForMessage(message, convoID, user);

            return Promise.all([p1, p2, p3]);
        }).then(function() {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
