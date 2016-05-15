var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = require(config.directory.api + '/middlewares')(passThrough);
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);

    router.get('/items', middlewares.session, function(req, res) {
        var user = req.session.user;
        var items = [];

        streamModel.fetchActiveFollowed(user.id).then(function(activeStreams) {
            items.push({'name': 'Active Streams (You Follow)', 'items': activeStreams});
        }).then(streamModel.getFeaturedItems).then(function(featuredStreams) {
            items.push({'name': 'Featured Streams', 'items': featuredStreams});
            res.json(helpers.outputResult(items));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/timeline', middlewares.session, function(req, res) {
        var user = req.session.user;
        var items = [];

        userModel.fetchUserTimeline(user.id).then(function(items) {
            res.json(helpers.outputResult(items));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
