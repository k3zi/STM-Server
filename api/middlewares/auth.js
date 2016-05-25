var basicAuth = require('basic-auth');
var config = require('config');
var helpers = require(config.directory.api + '/helpers');

module.exports = function(passThrough) {
    var exports = {};
    var userModel = require(config.directory.api + '/models/user')(passThrough);

    unauthorized = function(req, res, message) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.status(401).json({'success': false, 'error': message});
    }

    reauthenticate = function(req, valid) {
        var promise = userModel.find({username: req.get('stm-username'), password: req.get('stm-password')}).then(function(results) {
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
            return valid(true);
        }).catch(function(err) {
        	return valid(false);
        });
    }

    exports.requireAuth = function(req, res, next) {
        var auth = basicAuth(req);
        var providedAuth = auth && auth.name && auth.pass;
        if (!providedAuth) {
            return unauthorized(req, res, 'Authorization Required');
        }

        var isCorrectAuth = auth.name === config.auth.username && auth.pass === config.auth.password;
        if (!isCorrectAuth) {
            return unauthorized(req, res, 'Invalid Authorization');
        }

        if (!req.session.user && req.get('stm-username') && req.get('stm-password')) {
            reauthenticate(req, function (valid) {
                next();
            });
        } else {
            next();
        }
    }

    exports.requireLogin = function(req, res, next) {
        var session = req.session.user;
        if (session) return next();

        if (req.get('stm-username') && req.get('stm-password')) {
            reauthenticate(req, function (valid) {
                if (valid) next();
                else unauthorized(req, res, 'Invalid User Authorization');
            });
        } else {
            return unauthorized(req, res, 'User Authorization Required');
        }
    }

    return exports;
}
