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
        return config.test.authRequest(chai.request(url).post('/').send({'q': 'Ke'})).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });

    it('should return an empty array when provided an empty body', function(done) {
        return config.test.authRequest(chai.request(url).post('/')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });
});
