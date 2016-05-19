var seraph = require("seraph");
var Promise = require('promise');
var config = require('config');

var db = seraph(config.db);

var rel = {};
rel.read = Promise.denodeify(db.rel.read);
rel.update = Promise.denodeify(db.rel.update);

exports.save = Promise.denodeify(db.save);
exports.find = Promise.denodeify(db.find);
exports.query = Promise.denodeify(db.query);
exports.read = Promise.denodeify(db.read);
exports.relate = Promise.denodeify(db.relate);
exports.rel = rel;
