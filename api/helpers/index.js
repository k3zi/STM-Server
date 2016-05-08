var fs = require('fs');
var Promise = require('promise');
var config = require(process.argv[2] == 'dev' ? '../config/dev' : '../config/prod');
var hasher = new Hashids(config.hash.salt, config.hash.minLength, config.hash.characters);

export.encodeStr = function(str) {
    return hasher.encode(parseInt(str));
}

export.outputError = function(error) {
    return {
        'success': false,
        'error': error
    };
}

export.outputResult = function(result) {
    return {
        'success': true,
        'result': result
    };
}
