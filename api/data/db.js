var seraph = require("seraph");
var Promise = require('bluebird');
var config = require('config');

exports = Promise.denodeify(seraph(config.db));
