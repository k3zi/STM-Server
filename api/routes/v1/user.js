var express = require('express');
var router = express.Router();
var config = require('config');
var userModel = require(config.directory.api + '/models/user');
var middlewares = require(config.directory.api + '/middlewares');
var winston = require('winston');

router.post('/authenticate', middlewares.auth, function(req, res) {

});

module.exports = router;
