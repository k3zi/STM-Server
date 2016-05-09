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
config.log.exception = config.directory.home + "/api.exception.log";
config.log.api = config.directory.home + "/api.log";

config.auth = {};
config.auth.username = 'STM-API';
config.auth.password = "C/=}SU,nv)A**9cX.L&ML56";

config.app = {};
config.app.stream = {};
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

config.test = {};
config.test.session = {
    'id': 90,
    'displayName': 'Test User',
    'password': 'b0f812d4ae09a4835a5a8de5bb7889ace5ac2b69'
    'unverifiedEmail': 'test@stm.io',
    'description': 'My cool description!!',
    'apnsToken': '',
    'badge': 3,
    'username': 'test'
};
config.test.login = {
    'username': 'test',
    'password': 'zx$Peb{A3='
};

module.exports = config;
