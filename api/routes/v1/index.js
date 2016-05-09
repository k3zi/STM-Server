var express = require('express');
var config = require('config');
var helpers = require(config.directory.api + '/helpers');

var router = express.Router();
router.use('/user', require('./user'));

router.get('/status', function(req, res) {
    var result = helpers.outputResult('The server is doing fine.');
    res.json(result);
});

// Error Handling

router.use(function(req, res) {
    var result = helpers.outputError('404: Method Not Found');
    res.status(404).json(result);
});

router.use(function(error, req, res, next) {
    var result = helpers.outputError('500: Internal Server Error' + error);
    res.status(500).json(result);
 });

module.exports = router;
