var config = require('config');
var Hashids = require('hashids');
var hasher = new Hashids(config.hash.salt, config.hash.minLength, config.hash.characters);
var logger = config.log.logger;

var fs = require('fs');
var Promise = require('bluebird');
var md5 = require('md5');
var crypto = require('crypto');
var _ = require('lodash');
var apn = require('apn');
var db = require('../data/db');
var isThere = require('is-there');
var basicAuth = require('basic-auth');

var apnConnection = new apn.Provider(config.apn);

sendMessageToAPNS = function(message, token, badge) {
    if (!token || token.length == 0) {
        return;
    }

    logger.info('sendMessageToAPNS >> ' + token + ' >> ' + message);

    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = badge || 1;
    note.sound = "default";
    note.alert = message;

    return apnConnection.send(note, token);
};

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

exports.fixID = function(objectID) {
    if (typeof objectID == 'string') {
        objectID = parseInt(objectID);
    }

    return objectID;
}

exports.encodeStr = function(str) {
    return hasher.encode(parseInt(str));
}

exports.extend = function(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

exports.now = function() {
    return Math.floor(_.now()/1000);
}

exports.outputError = function(error, suppress, req) {
    var dict = typeof error.message !== 'undefined' ? { message: error.message, trace: error.stack } : { message: error };
    if (req) {
        dict.url = req.originalUrl;
        dict.userAgent = req.get('User-Agent');
        dict.headers = req.headers;
    }
    logger.error(dict);
    return {
        'success': false,
        'error': dict.message,
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
        var apnsMessage = 'Mentioned by @' + user.username + ': "' + comment.text + '"';

        logger.info('sendMentionsForComment >> apnsMessage >> ' + apnsMessage);
        return Promise.map(results, function (toUser) {
            logger.debug(toUser);
            return sendMessageToAPNS(apnsMessage, toUser.apnsToken, toUser.badge);
        });
    });
}

exports.sendNotificationsForMessage = function(message, convoID, user) {
    var cypher = "MATCH (user: User)-[:joined]->(convo: Conversation)"
    + " WHERE id(convo) = {convoID} AND id(user) <> {userID}"
    + " SET user.badge = user.badge + 1"
    + " RETURN user";
    return db.query(cypher, {'convoID': convoID, 'userID': user.id}).then(function(results) {
        var apnsMessage = '@' + user.username + ': ' + message.text;

        logger.info('sendNotificationsForMessage >> apnsMessage >> ' + apnsMessage);
        return Promise.map(results, function (toUser) {
            logger.debug(toUser);
            return sendMessageToAPNS(apnsMessage, toUser.apnsToken, toUser.badge);
        });
    });
}

exports.sendNotificationsForStreamContinue = function(stream, user) {
    var cypher = "MATCH (user: User)-[:follows]->(thisUser: User)"
    + " WHERE id(thisUser) = {userID}"
    + " SET user.badge = user.badge + 1"
    + " RETURN user";
    logger.debug('sendNotificationsForStreamContinue >> ' + cypher);
    return db.query(cypher, {'userID': user.id}).then(function(results) {
        logger.info('sendNotificationsForStreamContinue >> results >> ' + results);
        logger.debug(results);
        var apnsMessage = '@' + user.username + ' continued streaming: ' + stream.name;

        logger.info('sendNotificationsForStreamContinue >> apnsMessage >> ' + apnsMessage);
        return Promise.map(results, function (toUser) {
            logger.debug(toUser);
            return sendMessageToAPNS(apnsMessage, toUser.apnsToken, toUser.badge);
        });
    });
}

exports.sendNotificationsForStreamCreated = function (stream, user) {
    var cypher = "MATCH (user: User)-[:follows]->(thisUser: User)"
    + " WHERE id(thisUser) = {userID}"
    + " SET user.badge = user.badge + 1"
    + " RETURN user";
    return db.query(cypher, {'userID': user.id}).then(function(results) {
        var apnsMessage = '@' + user.username + ' created a stream called: ' + stream.name;

        logger.info('sendNotificationsForStreamCreated >> apnsMessage >> ' + apnsMessage);
        return Promise.map(results, function (toUser) {
            logger.debug(toUser);
            return sendMessageToAPNS(apnsMessage, toUser.apnsToken, toUser.badge);
        });
    });
}

exports.isThere = isThere;
exports.md5 = md5;
exports.sendMessageToAPNS = sendMessageToAPNS;
exports.sha1 = sha1;
exports.str_rot13 = str_rot13;
