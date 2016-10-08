var express = require('express');
var config = require('config');
var helpers = require(config.directory.api + '/helpers');

module.exports = function (passThrough) {
    var router = express.Router();

    router.use('/comment', require('./comment')(passThrough));
    router.use('/conversation', require('./conversation')(passThrough));
    router.use('/dashboard', require('./dashboard')(passThrough));
    router.use('/search', require('./search')(passThrough));
    router.use('/stream', require('./stream')(passThrough));
    router.use('/user', require('./user')(passThrough));

    router.get('/status', function(req, res) {
        var result = helpers.outputResult('The server is doing fine.');
        res.json(result);
    });

    // Error Handling

    router.use(function(req, res) {
        var result = helpers.outputError('404: Method Not Found');
        res.status(404).json(result);
    });

    router.use(function(error, req, res, next) {
        var result = helpers.outputError(error, false, req);
        res.json(result);
    });

    return router;
}
