var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

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

describe('/:id', function() {
    describe('GET /comments', function() {
        it('should return a list of streams', function(done) {
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

    describe('GET /info', function() {
        it('should return the users stats', function(done) {
            return config.test.authRequest(chai.request(url).get('/' + config.test.session.id + '/info')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });

        it('should return an error when provided a bogus user ID', function(done) {
            return config.test.authRequest(chai.request(url).get('/ghcgcyt/info')).end(function(err, res) {
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
});
