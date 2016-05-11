var should = require('chai').should();
var expect = require('chai').expect();
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';
request = request(url);

describe('POST /authenticate', function () {
    it('should return error when provided nothing', function(done) {
        config.test.authRequest(request.post('/authenticate')).send({})
            .excpect(200)
            .end(function(err, res) {
                if(err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.result.username).to.equal(config.test.login.username);
                done();
        });
    });
});
