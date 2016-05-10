var express = require('express');
var router = express.Router();
var config = require('config');
var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');
var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

router.get('/', middlewares.session, function(req, res) {
    var user = req.session.user;
    var items = [];

    streamModel.fetchActiveFollowed(user.id).then(function(activeStreams) {
        logger.info('Retrieved Active Streems: ' + activeStreams);
        items.push({'name': 'Active Streams (You Follow)', 'items': activeStreams});
    }).then(streamModel.getFeaturedItems).then(function(featuredStreams) {
        items.push({'name': 'Featured Streams', 'items': results});
        res.json(helpers.outputResult(items));
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
