var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/comment';

describe('/:id', function() {
    describe('GET /like', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/191/like')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/like')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /replys', function() {
        it('should return a list of comments', function(done) {
            return config.test.authRequest(chai.request(url).get('/191/replys')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/replys')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /repost', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/191/repost')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/repost')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /unlike', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/191/unlike')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/unlike')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });

    describe('GET /unrepost', function() {
        it('should return a success', function(done) {
            return config.test.loginRequest(chai.request(url).get('/191/unrepost')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.loginRequest(chai.request(url).get('/ghcgcyt/unrepost')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(false);
                done();
            });
        });
    });
});
