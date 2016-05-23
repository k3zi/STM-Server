var express = require('express');
var config = require('config');

var helpers = require(config.directory.api + '/helpers');
var logger = config.log.logger;

var router = express.Router();

module.exports = function(passThrough) {
    var middlewares = passThrough.middlewares;
    var userModel = require(config.directory.api + '/models/user')(passThrough);
    var streamModel = require(config.directory.api + '/models/stream')(passThrough);

    router.post('/create', middlewares.auth, function(req, res) {
        var data = req.body;
        var username = data.username || '';
        var password = data.password || '';
        var email = data.email || '';
        var displayName = data.displayName || '';

        var p1 = userModel.find({unverifiedEmail: email}).then(function(results) {
            if (results && results.length > 0) {
                return Promise.reject('A user is already using this email');
            }

            return Promise.resolve();
        });

        var p2 = userModel.find({username: username}).then(function(results) {
            if (results && results.length > 0) {
                return Promise.reject('A user is already using this username');
            }

            return Promise.resolve();
        });

        Promise.all([p1, p2]).then(function() {
            return userModel.create(username, password, email, displayName);
        }).then(function(user) {
            req.session.user = user;
            res.json(helpers.outputResult(user));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/authenticate', middlewares.auth, function(req, res) {
        var data = req.body;
        var username = data.username || '';
        var password = data.password || '';

        if (username.length == 0 || password.length == 0) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.find({username: data.username, password: data.password}).then(function(results) {
            if (!results || results.length == 0) {
                return Promise.reject('Invalid username/password');
            }

            return results[0];
        }).then(function(user) {
            req.session.user = user;
            res.json(helpers.outputResult(user));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/login', middlewares.auth, function(req, res) {
        var data = req.body;
        var username = data.username || '';
        var password = data.password || '';

        if (username.length == 0 || password.length == 0) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.find({username: data.username, password: helpers.hashPass(data.password)}).then(function(results) {
            return new Promise(function (fulfill, reject) {
                if (!results || results.length == 0) {
                    return reject('Invalid username/password');
                }

                var user = results[0];
                fulfill(user);
            });
        }).then(function(user) {
            req.session.user = user;
            res.json(helpers.outputResult(user));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/twitter/authenticate', middlewares.auth, function(req, res) {
        var data = req.body;
        var username = data.username || '';
        var twitterAuthToken = data.twitterAuthToken || '';

        if (username.length == 0 || twitterAuthToken.length == 0) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.find({twitterAuthToken: twitterAuthToken}).then(function(results) {
            if (!results || results.length == 0) {
                return userModel.find({username: username}).then(function(results) {
                    var isAvailable = (!results || results.length == 0);
                    res.json(helpers.outputResult({'usernameAvailable': isAvailable}));
                });
            } else {
                var user = results[0];
                req.session.user = user;
                res.json(helpers.outputResult(user));
            }
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/twitter/create', middlewares.auth, function(req, res) {
        var data = req.body;
        var username = data.username || '';
        var password = data.password || '';
        var displayName = data.displayName || '';

        var twitterAuthToken = data.twitterAuthToken || '';
        var twitterAuthTokenSecret = data.twitterAuthTokenSecret || '';

        var p1 = userModel.find({twitterAuthToken: twitterAuthToken}).then(function(results) {
            if (results && results.length > 0) {
                return Promise.reject('A user is already using this twitter account');
            }

            return Promise.resolve();
        });

        var p2 = userModel.find({username: username}).then(function(results) {
            if (results && results.length > 0) {
                return Promise.reject('A user is already using this username');
            }

            return Promise.resolve();
        });

        Promise.all([p1, p2]).then(function() {
            return userModel.createTwitter(username, password, email, displayName, twitterAuthToken, twitterAuthTokenSecret);
        }).then(function(user) {
            req.session.user = user;
            res.json(helpers.outputResult(user));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/updateAPNS', middlewares.session, function(req, res) {
        var user = req.session.user;
        var token = req.body.token;

        if (!token) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.updateAPNSForUser(token, user.id).then(function(result) {
            if (result) {
                req.session.user = user;
                res.json(helpers.outputResult(result));
            } else {
                res.json(helpers.outputError('APNS could not be updated'));
            }
        }).catch(function(err) {
            res.json(helpers.outputError(err));
        });
    });

    router.post('/update/:property', middlewares.session, function(req, res) {
        var user = req.session.user;
        var property = req.params.property;
        var value = req.body.value;

        if (!property || !value) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.updatePropertyForUser(property, value, user.id).then(function(result) {
            if (result) {
                req.session.user = user;
                res.json(helpers.outputResult(result));
            } else {
                res.json(helpers.outputError('Property could not be updated'));
            }
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.post('/upload/profilePicture', middlewares.uploadSession, function(req, res) {
        var user = req.session.user;
        var fstream = fs.createWriteStream(userModel.getUserDir(user.id) + 'profilePicture.png');
        req.pipe(fstream);

        fstream.on('error', function(err) {
            console.log(err);
           res.send(500, err);
        });

        fstream.on('finish', function() {
            res.json(helpers.outputResult({}));
        });
    });

    router.get('/:userID/comments', middlewares.auth, function(req, res) {
        var user = req.session.user;
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        logger.debug('/:userID/comments by: ' + (user ? user.id : -1));
        userModel.fetchUserSelectiveTimeline(userID, (user ? user.id : -1)).then(function(results) {
            res.json(helpers.outputResult(results));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/follow', middlewares.session, function(req, res) {
        var user = req.session.user;
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.followUser(user.id, userID).then(function(result) {
            if (result) {
                helpers.sendMessageToAPNS(user.displayName + ' (@' + user.username + ') is now following you', result.apnsToken, result.badge);
            }

            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/likes', middlewares.auth, function(req, res) {
        var user = req.session.user;
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.fetchUserLikes(userID, (user ? user.id : -1)).then(function(results) {
            res.json(helpers.outputResult(results));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/profilePicture', middlewares.auth, function(req, res) {
        var userID = req.params.userID;
        helpers.checkID(userID).then(function(userID) {
            var file = userModel.getUserDir(userID) + 'profilePicture.png';
            helpers.isThere(file, function(exists) {
                if (exists) {
                    res.sendFile(file);
                } else {
                    res.status(404);
                    res.end();
                }
            });
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/streams', middlewares.auth, function(req, res) {
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        streamModel.fetchStreamsForUserID(userID).then(function(results) {
            res.json(helpers.outputResult(results));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/stats', middlewares.auth, function(req, res) {
        var user = req.session.user;
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        var items = {};

        helpers.checkID(userID).then(function(userID) {
            var tasks = [];
            tasks.push(userModel.countUserFollowing(userID));
            tasks.push(userModel.countUserFollowers(userID));
            tasks.push(userModel.countUserComments(userID));
            if (user) {
                tasks.push(userModel.userIsFollowingUser(user.id, userID));
                tasks.push(userModel.userIsFollowingUser(userID, user.id));
            }

            return Promise.all(tasks);
        }).then(function(values) {
            items.following = values[0];
            items.followers = values[1];
            items.comments = values[2];
            items.isFollowing = values[3];
            items.isFollower = values[4];
        }).then(function() {
            res.json(helpers.outputResult(items));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    router.get('/:userID/unfollow', middlewares.session, function(req, res) {
        var user = req.session.user;
        var userID = req.params.userID;
        if (!userID) {
            return res.json(helpers.outputError('Missing Paramater'));
        }

        userModel.unfollowUser(user.id, userID).then(function(result) {
            res.json(helpers.outputResult({}));
        }).catch(function(err) {
        	res.json(helpers.outputError(err));
        });
    });

    return router;
}
