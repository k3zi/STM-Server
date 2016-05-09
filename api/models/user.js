var fs = require('fs-promise');
var Promise = require('promise');
var config = require('config');

var logger = config.log.logger;
var helpers = require('../helpers');
var db = require('../data/db');

getUserDir = function(userID) {
    return config.directory.user_content + '/' + helpers.encodeStr(userID) + '/';
}

createUserDirectory = function(user) {
    return new Promise(function (fulfill, reject) {
        fs.ensureDir(getUserDir(user.id), function(err) {
            if (err) reject(err);
            else fulfill(user);
        });
    });
}

exports.create = function(username, password, password, unverifiedEmail, displayName) {
    var user = {
        username: username,
        password: password,
        unverifiedEmail: unverifiedEmail,
        displayName: displayName,
        badge: 0
    }

    return db.save(user, 'User').then(createUserDirectory);
}

exports.find = function(params) {
    return new Promise(function (fulfill, reject) {
        logger.debug('Check params: ' + params);
        if (params.length == 0) reject('no paramaters sent');

        fulfill(params);
    }).then(function(params) {
        logger.debug('Params checked out: ' + params);
        return db.find(params, 'User');
    });
}
