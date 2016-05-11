var should = require('chai').should();
var expect = require('chai').expect();
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/dashboard';
request = request(url);

describe('GET /', function () {
    it('should have the an arry of the dashboards contents', function(done) {
        config.test.loginRequest(request.get('/'))
            .excpect(200)
            .end(function(err, res) {
                if(err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.result.constructor).to.equal(Array);
                done();
        });
    });
});
