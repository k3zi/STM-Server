var seraph = require("seraph");
var Promise = require('bluebird');
var config = require('config');

var db = seraph(config.db);

var rel = {};
rel.read = Promise.promisify(db.rel.read);
rel.update = Promise.promisify(db.rel.update);

exports.save = Promise.promisify(db.save);
exports.find = Promise.promisify(db.find);
exports.query = Promise.promisify(db.query);
exports.read = Promise.promisify(db.read);
exports.relate = Promise.promisify(db.relate);
exports.rel = rel;
