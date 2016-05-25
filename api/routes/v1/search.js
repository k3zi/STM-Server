var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var commentModel = require(config.directory.api + '/models/comment')(passThrough);

    router.post('/', middlewares.auth, function(req, res, next) {
        var user = req.session.user;
        var userID =  (user ? user.id : -1);
        var q = req.body.q;
        var items = [];

        if (!q) {
            return res.json(helpers.outputResult([]));
        }

        userModel.search(q, userID).then(function (results) {
            items = items.concat(results);
            return streamModel.search(q, userID);
        }).then(function (results) {
            items = items.concat(results);
            res.json(helpers.outputResult(items));
        }).catch(next);
    });

    router.post('/followers', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var q = req.body.q;

        if (!q) {
            return res.json(helpers.outputResult([]));
        }

        userModel.searchFollowers(q, user.id).then(function(results) {
            res.json(helpers.outputResult(results));
        }).catch(next);
    });

    return router;
}
