var config = require('config');
var hasher = require("hashids")(config.hash.salt, config.hash.minLength, config.hash.characters);

var fs = require('fs');
var Promise = require('promise');
var md5 = require('md5');
var crypto = require('crypto');
var _ = require('lodash');

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

exports.sendMessageToAPNS = function(message, token, badge) {
    if (!token || token.length == 0) {
        return;
    }

    var myDevice = new apn.Device(token);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = badge ? badge : 1;
    note.sound = "default";
    note.alert = message;

    apnConnection.pushNotification(note, myDevice);
    apnConnectionDev.pushNotification(note, myDevice);
}

exports.sha1 = function(data) {
    var generator = crypto.createHash('sha1');
    generator.update(data);
    return generator.digest('hex');
}

exports.str_rot13 = function(s) {
    return (s ? s : this).split('').map(function(_) {
        if (!_.match(/[A-za-z]/)) return _;
        c = Math.floor(_.charCodeAt(0) / 97);
        k = (_.toLowerCase().charCodeAt(0) - 83) % 26 || 26;
        return String.fromCharCode(k + ((c == 0) ? 64 : 96));
    }).join('');
}

exports.md5 = md5;
