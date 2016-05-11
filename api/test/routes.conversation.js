var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/conversation';

describe('GET /list', function() {
    it('should have an array of the users conversations', function(done) {
        return config.test.loginRequest(chai.request(url).get('/list')).end(function(err, res) {
            should.equal(err, null);
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(true);
            done();
        });
    });
});
