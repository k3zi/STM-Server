var winston = require('winston');
var config = {};

config.baseURL = 'https://api.stm.io';

config.versions = ['/v1', '/v2'];

config.directory = {};
config.directory.home = "/home/stm";
config.directory.api = config.directory.home + "/api";
config.directory.user_content = config.directory.home + "/user_content";
config.directory.stream_content = config.directory.home + "/stream_content";

config.log = {};
config.log.level = 'debug';
config.log.exception = config.directory.home + "/api.prod.exception.log";
config.log.api = config.directory.home + "/api.prod.log";

winston.add(winston.transports.File, {
  filename: config.log.api
});

winston.handleExceptions(new winston.transports.File({
	filename: config.log.exception
}));

winston.level = config.log.level;
config.log.logger = winston;

config.auth = {};
config.auth.username = 'STM-API';
config.auth.password = "PXsd<rhKG0r'@U.-Z`>!9V%-Z<Z";

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
config.apn.cert = config.directory.home + '/keychain/production_com.stormedgeapps.streamtome.pem';
config.apn.key = config.directory.home + '/keychain/production_com.stormedgeapps.streamtome.pkey';
config.apn.production = true;

config.db = {};
config.db.server = 'https://stm.io:7473';
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
