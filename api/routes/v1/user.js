var express = require('express');
var router = express.Router();
var config = require('config');
var User = require(config.directory.api + '/models/user');
var middlewares = require(config.directory.api + '/middlewares');

router.post('/authenticate', middlewares.auth, function(req, res) {
    var data = req.body;
    db.find({
        username: data.username,
        password: data.password
    }, 'User', function(err, results) {
        if (!results || results.length == 0) {
            console.log(err);
            return res.json(outputError('Invalid username/password'));
        }

        var user = results[0];
        req.session.user = user;
        ensureExists(getUserDir(user.id), function(err) {
            res.json(outputResult(user));
        });
    });
});

module.exports = router
