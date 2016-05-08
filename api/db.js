var seraph = require("seraph");
var Promise = require('promise');

var db = seraph({
    'server': 'http://69.4.80.29:7474',
    user: 'neo4j',
    pass: 'gbmpYiJq9f0KOQSjAj'
});

exports.save = Promise.denodeify(db.save);
exports.find = Promise.denodeify(db.find);
