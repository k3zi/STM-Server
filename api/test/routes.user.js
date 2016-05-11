var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';
request = request(url);

describe('POST /authenticate', function () {
    it('should return error when provided an empty body', function(done) {
        config.test.authRequest(request.post('/authenticate')).send({}).end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(1);
            res.body.result.username.should.equal(config.test.login.username);
            done();
        });
    });
});
