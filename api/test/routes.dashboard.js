var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/dashboard';

describe('GET /items', function() {
    it('should have an array of the dashboards header items', function(done) {
        return config.test.loginRequest(chai.request(url).get('/items')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });
});

describe('GET /timeline', function() {
    it('should have an array of the users timeline comments', function(done) {
        return config.test.loginRequest(chai.request(url).get('/timeline')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });
});
