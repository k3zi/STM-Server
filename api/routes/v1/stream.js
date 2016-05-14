var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = require(config.directory.api + '/middlewares')(passThrough);
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);

    router.get('/:streamID/isOnline', middlewares.auth, function(req, res) {
        var streamID = req.params.streamID;

        if (!streamID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        helpers.checkID(streamID).then(streamModel.streamLastOnline).then(function(lastOnline) {
            if (lastOnline < 10) {
                res.json(helpers.outputResult({'online': 1}));
            } else if (lastOnline < 45) {
                res.json(helpers.outputResult({'online': 2}));
            } else {
                res.json(helpers.outputResult({'online': 0}));
            }
        }).catch(function(err) {
            logger.error(err);
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
