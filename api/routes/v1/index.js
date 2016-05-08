var express = require('express');
var helpers = require('../../helpers');

var router = express.Router();
router.use('/user', require('./user'));

router.get('/status', function(req, res) {
    helpers.outputResult('The server is doing fine.');
});

module.exports = router;
