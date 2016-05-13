var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/search';

describe('POST /', function() {
    it('should return an array of results', function(done) {
        return config.test.authRequest(chai.request(url).post('/search').send({'q': 'Ke'})).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });

    it('should return an empty array when provided an empty body', function(done) {
        return config.test.authRequest(chai.request(url).post('/search')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
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
});
