var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');
var helpers = require(config.directory.api + '/helpers');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';

describe('POST /authenticate', function() {
    it('should return a user object', function(done) {
        return config.test.authRequest(chai.request(url).post('/authenticate').send(config.test.session)).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            res.body.result.username.should.equal(config.test.session.username);
            done();
        });
    });

    it('should return error when provided an empty body', function(done) {
        return config.test.authRequest(chai.request(url).post('/authenticate')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(false);
            done();
        });
    });
});

describe('POST /login', function() {
    it('should return a user object', function(done) {
        return config.test.authRequest(chai.request(url).post('/login').send(config.test.login)).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            res.body.result.username.should.equal(config.test.session.username);
            done();
        });
    });

    it('should return error when provided an empty body', function(done) {
        return config.test.authRequest(chai.request(url).post('/authenticate')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(false);
            done();
        });
    });
});

describe('POST /updateAPNS', function() {
    it('should return a user object', function(done) {
        var randomStr = helpers.randomStr(64);
        return config.test.loginRequest(chai.request(url).post('/updateAPNS').send({'token': randomStr})).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            res.body.result.username.should.equal(config.test.session.username);
            res.body.result.apnsToken.should.equal(randomStr);
            done();
        });
    });

    it('should return error when provided an empty body', function(done) {
        return config.test.loginRequest(chai.request(url).post('/updateAPNS')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(false);
            done();
        });
    });
});

describe('POST /update/:property', function() {
    it('should return a user object', function(done) {
        var randomInt = helpers.randomInt(0, 100);
        return config.test.loginRequest(chai.request(url).post('/update/badge').send({'value': randomInt})).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            res.body.result.username.should.equal(config.test.session.username);
            res.body.result.badge.should.equal(randomInt);
            done();
        });
    });

    it('should return error when provided an empty body', function(done) {
        return config.test.loginRequest(chai.request(url).post('/update/badge')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(false);
            done();
        });
    });
});

describe('/:id', function() {
    describe('GET /comments', function() {
        it('should return a list of comments', function(done) {
            return config.test.authRequest(chai.request(url).get('/' + config.test.session.id + '/comments')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/comments')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /follow', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/0/follow')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/follow')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /likes', function() {
        it('should return a list of comments liked by the specified user', function(done) {
            return config.test.authRequest(chai.request(url).get('/' + config.test.session.id + '/likes')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/likes')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /stats', function() {
        it('should return the users stats', function(done) {
            return config.test.authRequest(chai.request(url).get('/' + config.test.session.id + '/stats')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/stats')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /streams', function() {
        it('should return a list of streams', function(done) {
            return config.test.authRequest(chai.request(url).get('/' + config.test.session.id + '/streams')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/streams')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /unfollow', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/0/unfollow')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/unfollow')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });
});
