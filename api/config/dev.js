var config = {};

config.directory = {};
config.directory.user_content = "/home/stream/user_content";
config.directory.stream_content = "/home/stream/stream_content";

config.auth = {};
config.auth.username = 'STM-API';
config.auth.password = "PXsd<rhKG0r'@U.-Z`>!9V%-Z<Z";

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
config.apn.cert = '/home/stream/keychain/development_com.stormedgeapps.streamtome.pem';
config.apn.key = '/home/stream/keychain/development_com.stormedgeapps.streamtome.pkey';
config.apn.production = false;

module.exports = config;
