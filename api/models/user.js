var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');

getUserDir = function(userID) {
    return config.directory.user_content + '/' + helpers.encodeStr(userID) + '/';
}

ensureUserDirectoryExists = function(user) {
    return new Promise(function (fulfill, reject) {
        fs.ensureDir(getUserDir(user.id), function(err) {
            if (err) reject(err);
            else fulfill(user);
        });
    });
}

exports.create = function(username, password, password, unverifiedEmail, displayName) {
    return new Promise(function (fulfill, reject) {
        if (username.length == 0 || password.length == 0 || unverifiedEmail.length == 0 || displayName.length == 0) {
            return reject('Missing Paramater');
        }

        var user = {
            username: username,
            password: password,
            unverifiedEmail: unverifiedEmail,
            displayName: displayName,
            badge: 0
        }

        fulfill(user);
    }).then(function(user) {
        return db.save(user, 'User');
    }).then(ensureUserDirectoryExists);
}

exports.find = function(params) {
    return new Promise(function (fulfill, reject) {
        if (params.length == 0) reject('no paramaters sent');

        fulfill(params);
    }).then(function(params) {
        return db.find(params, 'User');
    }).then(ensureUserDirectoryExists);
}
