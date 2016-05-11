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
