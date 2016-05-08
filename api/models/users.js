var db = require('../db');
var fs = require('fs-promise');
var helpers = require('helpers');
var Promise = require('promise');
var config = require(process.argv[2] == 'dev' ? '../config/dev' : '../config/prod');

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
