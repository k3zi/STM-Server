var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/user';
request = request(url).auth(config.auth.username, config.auth.password);

describe('POST /authenticate', function () {
    it('should return error when provided nothing', function(done) {
        request.post('/authenticate').send({})
            .expect('Content-Type', /json/)
            .expect(200, {status: false}, done);
    });
});
