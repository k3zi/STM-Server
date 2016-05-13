var express = require('express');
var config = require('config');

var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');
var commentModel = require(config.directory.api + '/models/comment');

var router = express.Router();

router.post('/', middlewares.auth, function(req, res) {
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
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
