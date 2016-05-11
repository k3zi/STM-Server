var express = require('express');
var config = require('config');

var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');

var router = express.Router();

router.post('/authenticate', middlewares.auth, function(req, res) {
    var data = req.body;
    var username = data.username || '';
    var password = data.password || '';

    if (username.length == 0 || password.length == 0) {
        return res.json(helpers.outputError('Missing Paramater'));
    }

    var promise = userModel.find({username: data.username, password: data.password}).then(function(results) {
        return new Promise(function (fulfill, reject) {
            if (!results || results.length == 0) {
                return reject('Invalid username/password');
            }

            var user = results[0];
            fulfill(user);
        });
    });

    promise.then(function(user) {
        req.session.user = user;
        res.json(helpers.outputResult(user));
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });

});

router.get('/:userID/streams', middlewares.auth, function(req, res) {
    var userID = req.params.userID;
    if (!userID) {
        return res.json(helpers.outputError('Missing Paramater'));
    }
    logger.debug('received user id: ' + userID);
    streamModel.fetchStreamsForUserID(userID).then(function(results) {
        res.json(helpers.outputResult(results));
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
