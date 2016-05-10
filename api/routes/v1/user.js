var express = require('express');
var router = express.Router();
var config = require('config');
var userModel = require(config.directory.api + '/models/user');
var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

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
        logger.log(user);
        res.json(helpers.outputResult(user));
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });

});

module.exports = router;
