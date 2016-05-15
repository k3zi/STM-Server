var config = require('config');
var hasher = require("hashids")(config.hash.salt, config.hash.minLength, config.hash.characters);
var logger = config.log.logger;

var fs = require('fs');
var Promise = require('promise');
var md5 = require('md5');
var crypto = require('crypto');
var _ = require('lodash');
var apn = require('apn');
var db = require('../data/db');

var apnConnection = new apn.Connection(config.apn);

sendMessageToAPNS = function(message, token, badge) {
    if (!token || token.length == 0) {
        return;
    }

    var myDevice = new apn.Device(token);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = badge || 1;
    note.sound = "default";
    note.alert = message;

    apnConnection.pushNotification(note, myDevice);
}

sha1 = function(data) {
    var generator = crypto.createHash('sha1');
    generator.update(data);
    return generator.digest('hex');
}

str_rot13 = function(s) {
    return (s ? s : this).split('').map(function(_) {
        if (!_.match(/[A-za-z]/)) return _;
        c = Math.floor(_.charCodeAt(0) / 97);
        k = (_.toLowerCase().charCodeAt(0) - 83) % 26 || 26;
        return String.fromCharCode(k + ((c == 0) ? 64 : 96));
    }).join('');
}

exports.checkID = function(objectID) {
    return new Promise(function (fulfill, reject) {
        if (typeof objectID == 'string') {
            objectID = parseInt(objectID);
        }

        if (objectID < 0 || isNaN(objectID)) return reject('Invalid ID');
        fulfill(objectID);
    });
}

exports.encodeStr = function(str) {
    return hasher.encode(parseInt(str));
}

exports.now = function() {
    return Math.floor(_.now()/1000);
}

exports.outputError = function(error, suppress) {
    logger.error(error);

    return {
        'success': false,
        'error': error,
        'suppress': suppress || false
    };
}

exports.outputResult = function(result) {
    return {
        'success': true,
        'result': result
    };
}

exports.hashPass = function(pass) {
    return sha1(md5(pass) + md5(pass.length) + md5(str_rot13(pass)));
}

exports.randomInt = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

exports.randomStr = function(numberOfCharacters) {
    var num = Math.ceil(numberOfCharacters/2);
    var str = crypto.randomBytes(num).toString('hex');
    return str.substr(0, numberOfCharacters);
}

exports.sendMentionsForComment = function(comment, user) {
    var mentions = comment.text.match(config.regex.mentionRegex);
    var filteredMentions = [];
    if (mentions) {
        mentions = mentions.map(function(item) {
            return item.substr(1);
        });
    }

    var cypher = "MATCH (n: User)"
    + " WHERE n.username IN {filteredMentions} AND id(n) <> {userID}"
    + " SET n.badge = n.badge + 1"
    + " RETURN n";
    return db.query(cypher, {'filteredMentions': filteredMentions, 'userID': user.id}).then(function(results) {
        var message = 'Mentioned by @' + user.username + ': "' + comment.text + '"';

        for (var i in results) {
            var toUser = results[i];
            sendMessageToAPNS(message, toUser.apnsToken, toUser.badge);
        }
    });
}

exports.md5 = md5;
exports.sendMessageToAPNS = sendMessageToAPNS;
exports.sha1 = sha1;
exports.str_rot13 = str_rot13;
