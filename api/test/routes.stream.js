var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/stream';

describe('/:id', function() {
    describe('GET /isOnline', function() {
        it('should return a dictionary with a boolean', function(done) {
            return config.test.authRequest(chai.request(url).get('/90/isOnline')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });
    });

    describe('GET /playStream', function() {
        it('should return a dictionary with a boolean', function(done) {
            return config.test.authRequest(chai.request(url).get('/90/playStream')).end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });
    });
});
