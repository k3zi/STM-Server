var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);

    function fetchMeta(stream) {
      return passThrough.mysql.query('SELECT * FROM stream_meta WHERE meta_stream_id = ' + stream.id + ' ORDER BY meta_id DESC LIMIT 1').then(function (rows) {
        stream.meta = rows.length > 0 ? rows[0] : {};
        return stream;
      });
    }

    router.get('/items', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var items = [];

        streamModel.fetchActiveFollowed(user.id).then(function(activeStreams) {
          return Promise.all(activeStreams.map(fetchMeta)).then(function (streams) {
            items.push({'name': 'Active Streams (You Follow)', 'items': streams});
          });
        }).then(streamModel.getFeaturedItems).then(function(featuredStreams) {
          return Promise.all(featuredStreams.map(fetchMeta)).then(function (streams) {
            items.push({'name': 'Featured Streams', 'items': streams});
            res.json(helpers.outputResult(items));
          });
        }).catch(next);
    });

    router.get('/timeline', middlewares.session, function(req, res, next) {
        var user = req.session.user;
        var items = [];

        userModel.fetchUserTimeline(user.id).then(function(items) {
            res.json(helpers.outputResult(items));
        }).catch(next);
    });

    return router;
}
