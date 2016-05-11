var express = require('express');
var config = require('config');

var middlewares = require(config.directory.api + '/middlewares');
var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var userModel = require(config.directory.api + '/models/user');
var streamModel = require(config.directory.api + '/models/stream');

var router = express.Router();

router.post('/:streamID/isOnline', middlewares.auth, function(req, res) {
    var streamID = req.params.streamID;

    if (!userID) {
        return res.json(helpers.outputError('Missing Paramater'));
    }

    helpers.checkID(streamID).then(streamModel.streamLastOnline).then(function(lastOnline) {
        if (lastOnline < 10) {
            res.json(outputResult({'online': 1}));
        } else if (lastOnline < 45) {
            res.json(outputResult({'online': 2}));
        } else {
            res.json(outputResult({'online': 0}));
        }
    }).catch(function(err) {
    	res.json(helpers.outputError(err));
    });
});

module.exports = router;
