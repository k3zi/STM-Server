var basicAuth = require('basic-auth');
var config = require('config');
var helpers = require(config.directory.api + '/helpers');


unauthorized = function(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    var result = helpers.outputError('Authorization Required');
    res.status(401).json(result);
}

determineAuthentication = function(authorized, req, res, next) {
    if (authorized) {
        return next();
    } else {
        return unauthorized(res);
    }
}

exports.requireAuth = function(req, res, next) {
    var auth = basicAuth(req);
    var authorized = auth && auth.name && auth.pass && auth.name === config.auth.username && auth.pass === config.auth.password;
    return determineAuthentication(authorized, req, res, next);
}
