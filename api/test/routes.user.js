var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

require('ssl-root-cas').inject();
chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';

describe('POST /authenticate', function() {
    it('should return error when provided an empty body', function() {
        return chai.request(url).post('/authenticate').end(function(err, res) {
            console.log(res);
            expect(res).should.have.status(200);
            expect(res).should.be.json;
            expect(res.body.success).should.equal(1);
            expect(res.body.result.username).should.equal(config.test.login.username);
        });
    });
});
