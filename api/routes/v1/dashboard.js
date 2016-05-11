var express = require('express');
var router = express.Router();
var config = require('config');
var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');
var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

router.get('/items', middlewares.session, function(req, res) {
    var user = req.session.user;
    var items = [];

    streamModel.fetchActiveFollowed(user.id).then(function(activeStreams) {
        logger.debug('Retrieved Active Streams: ' + activeStreams);
        items.push({'name': 'Active Streams (You Follow)', 'items': activeStreams});
    }).then(streamModel.getFeaturedItems).then(function(featuredStreams) {
        logger.debug('Retrieved Featured Streams: ' + featuredStreams);
        items.push({'name': 'Featured Streams', 'items': featuredStreams});
        res.json(helpers.outputResult(items));
    }).catch(function(err) {
        logger.error(err);
    	res.json(helpers.outputError(err));
    });
});

router.get('/timeline', middlewares.session, function(req, res) {
    var user = req.session.user;
    var items = [];

    userModel.fetchUserTimeline(user.id).then(function(items) {
        res.json(helpers.outputResult(items));
    }).catch(function(err) {
        logger.error(err);
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
