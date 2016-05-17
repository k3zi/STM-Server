var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);
    var relationships = require(config.directory.api + '/models/relationships')(passThrough);

    router.post('/create', middlewares.session, function(req, res) {
        var user = req.session.user;

        var data = {
            'name': req.body.name,
            'type': req.body.type || 0,
            'description': req.body.description,
            'private': false
        };

        streamModel.create(data).then(function(stream) {
            return relationships.relateUserToStream(user.id, stream.id).then(function() {
                return streamModel.incrementStream(stream.id);
            }).then(function(securityHash) {
                stream.securityHash = securityHash;
                stream.streamAlphaID = helpers.encodeStr(stream.id);
                return helpers.sendNotificationsForStreamContinue(stream, user);
            }).then(function() {
                return streamModel.save(stream);
            });
        }).then(function(stream) {
            res.json(helpers.outputResult(stream));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/:streamID/continue', middlewares.session, function(req, res) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        var streamAlpha = helpers.encodeStr(streamID);

        streamModel.fetchStreamWithID(streamID, user.id).then(function(stream) {
            return streamModel.incrementStream(stream.id).then(function(securityHash) {
                stream.securityHash = securityHash;
                return helpers.sendNotificationsForStreamContinue(stream, user);
            }).then(function() {
                return streamModel.save(stream);
            });
        }).then(function(stream) {
            res.json(helpers.outputResult(stream));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:streamID/delete', middlewares.session, function(req, res) {
        var user = req.session.user;
        var streamID = req.params.streamID;

        if (!streamID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        streamModel.delete(streamID, user.id).then(function() {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

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
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/:streamID/update/:property', middlewares.session, function(req, res) {
        var user = req.session.user;
        var property = req.params.property;
        var value = req.body.value;
        var streamID = req.params.streamID;

        if (!property || !value || !streamID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        streamModel.updatePropertyForStream(property, value, streamID, user.id).then(function(result) {
            res.json(helpers.outputResult(result));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
