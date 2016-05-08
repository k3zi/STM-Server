var express = require('express');
var router = express.Router();
var User = require('../../models/user');

router.post('/authenticate', jsonParser, urlEncodeHandler, regularAuth, function(req, res) {
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
