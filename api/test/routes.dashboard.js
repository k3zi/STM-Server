var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/dashboard';
request = request(url);

describe('GET /', function () {
    it('should have the an arry of the dashboards contents', function(done) {
        config.test.loginRequest(request).post('/')
            .expect('Content-Type', /json/)
            .expect(200, {status: false}, done);
    });
});
