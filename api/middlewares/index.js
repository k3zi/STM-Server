var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

module.exports = function(passThrough) {
    var exports = {};
    var serverAuth = require('./auth')(passThrough);

    exports.cookieParser = cookieParser();
    exports.expressSession = expressSession({
        secret: 'pTb8zDt8drE69B949bHx',
        expires: new Date(Date.now() + 3600000 * 24),
        resave: true,
        saveUninitialized: true
    });
    exports.serverAuth = serverAuth.requireAuth;
    exports.sessionAuth = serverAuth.requireLogin;
    exports.jsonParser = bodyParser.json({limit: '50mb'});
    exports.urlEncodeHandler = bodyParser.urlencoded({limit: '50mb', extended: true});
    exports.json = function(req, res, next) {
        res.setHeader('Content-Type', 'application/json');
        return next();
    }

    exports.raw =  [exports.cookieParser, exports.expressSession, exports.jsonParser, exports.urlEncodeHandler]
    exports.normal = [exports.cookieParser, exports.expressSession, exports.jsonParser, exports.urlEncodeHandler, exports.json];
    exports.auth = [exports.cookieParser, exports.expressSession, exports.serverAuth, exports.jsonParser, exports.urlEncodeHandler, exports.json];
    exports.session = [exports.cookieParser, exports.expressSession, exports.serverAuth, exports.sessionAuth, exports.jsonParser, exports.urlEncodeHandler, exports.json];

    return exports;
}
