var seraph = require("seraph");
var Promise = require('bluebird');
var config = require('config');

exports = Promise.promisifyAll(seraph(config.db));
