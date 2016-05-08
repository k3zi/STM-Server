var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var serverAuth = require('./auth');

exports.cookieParser = cookieParser();
exports.expressSession = expressSession({
    secret: 'pTb8zDt8drE69B949bHx',
    expires: new Date(Date.now() + 3600000 * 24),
    resave: true,
    saveUninitialized: true
});
exports.serverAuth = serverAuth.requireAuth;
exports.jsonParser = bodyParser.json({limit: '50mb'});
exports.urlEncodeHandler = bodyParser.urlencoded({limit: '50mb', extended: true});

exports.normal = [exports.cookieParser, exports.expressSession, exports.jsonParser, exports.urlEncodeHandler];
exports.auth = [exports.cookieParser, exports.expressSession, exports.serverAuth, exports.jsonParser, exports.urlEncodeHandler]
