var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';
request = request(url);

describe('/authenticate', function () {
    it('should return the logged in user', function(done) {
        request.post('/authenticate').send(config.test.login)
            .expect('Content-Type', /json/)
            .expect(200, {username: 'test', password: 'TOBI'}, done);
    });
});
