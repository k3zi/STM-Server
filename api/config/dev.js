var winston = require('winston');
var config = {};

config.baseURL = 'https://api-dev.stm.io';

config.versions = [];
config.versions.push('/v1');

config.directory = {};
config.directory.home = "/home/stream";
config.directory.api = config.directory.home + "/api";
config.directory.user_content = config.directory.home + "/user_content";
config.directory.stream_content = config.directory.home + "/stream_content";

config.log = {};
config.log.level = 'debug';
config.log.exception = config.directory.home + "/api.exception.log";
config.log.api = config.directory.home + "/api.log";

winston.add(winston.transports.File, {
  filename: config.log.api
});

winston.handleExceptions(new winston.transports.File({
	filename: config.log.exception
}));

winston.level = config.log.level;
config.log.logger = winston;

config.auth = {};
config.auth.username = 'STM-DEV-API';
config.auth.password = "C/=}SU,nv)A**9cX.L&ML56";

config.app = {};
config.app.stream = {};
config.app.stream.socketAuth = "WrfN'/:_f.#8fYh(=RY(LxTDRrU";
config.app.stream.secondsRequiredToStartPlaying = 1.5;
config.app.stream.secondsRequiredToStartPlayingAfterBufferUnderun = 3.0;
//config.app.stream.bufferSizeInSeconds = 10.0;

config.hash = {};
config.hash.salt = 'pepper';
config.hash.minLength = 4;
config.hash.characters = 'abcdefghijkmnpqrstuxyACDEFGHKMNPQRSTUQY23456789';

config.regex = {};
config.regex.mentionRegex = /\B@[a-z0-9_-]+/gi;

config.apn = {};
config.apn.cert = config.directory.home + '/keychain/development_com.stormedgeapps.streamtome.pem';
config.apn.key = config.directory.home + '/keychain/development_com.stormedgeapps.streamtome.pkey';
config.apn.production = false;

config.db = {};
config.db.server = 'http://69.4.80.29:7474';
config.db.user = 'neo4j';
config.db.pass = 'gbmpYiJq9f0KOQSjAj';
config.db.constructLike = function(q) {
    return  "=~ '(?i).*" + q + ".*'";
}

config.test = {};
config.test.session = {
    'id': 311,
    'displayName': 'API Test',
    'password': '5ce66553e9b178f7e94d4953e206391e2b887118',
    'unverifiedEmail': 'apitest@stm.io',
    'description': 'My cool description!!',
    'apnsToken': '',
    'badge': 3,
    'username': 'apitest'
};
config.test.login = {
    'username': 'apitest',
    'password': 'zx$Peb{A3='
};
config.test.authRequest = function(request) {
    return request.auth(config.auth.username, config.auth.password);
}

config.test.loginRequest = function(request) {
    return request.auth(config.auth.username, config.auth.password).set('STM-USERNAME', config.test.session.username).set('STM-PASSWORD', config.test.session.password);
}

module.exports = config;
