var fs = require('fs');
var Promise = require('promise');
var config = require(process.argv[2] == 'dev' ? '../config/dev' : '../config/prod');
var hasher = require("hashids")(config.hash.salt, config.hash.minLength, config.hash.characters);

exports.encodeStr = function(str) {
    return hasher.encode(parseInt(str));
}

exports.outputError = function(error) {
    return {
        'success': false,
        'error': error
    };
}

exports.outputResult = function(result) {
    return {
        'success': true,
        'result': result
    };
}
