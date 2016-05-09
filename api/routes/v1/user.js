var express = require('express');
var router = express.Router();
var config = require('config');
var userModel = require(config.directory.api + '/models/user');
var middlewares = require(config.directory.api + '/middlewares');
var winston = require('winston');

router.post('/authenticate', middlewares.auth, function(req, res) {
    var data = req.body;
    winston.debug('Login request received: ' + data.username);

    userModel.find({username: data.username, password: data.password}).then(function(results) {
        return new Promise(function (fulfill, reject) {
            if (!results || results.length == 0) {
                return reject('Invalid username/password');
            }

            var user = results[0];
            req.session.user = user;
            ensureExists(getUserDir(user.id), function(err) {
                res.json(outputResult(user));
            });
        });
    });
});

module.exports = router;
