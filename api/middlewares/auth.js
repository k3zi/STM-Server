var basicAuth = require('basic-auth');
var config = require(process.argv[2] == 'dev' ? '../config/dev' : '../config/prod');

unauthorized = function(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
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
