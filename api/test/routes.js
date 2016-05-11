var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');
var config = require('../config/dev');

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version;
request = request(url);

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe(version, function () {

    describe('GET /status', function () {
        it('should return 200 OK', function done() {
            request.get('/status').expect('Content-Type', /json/).expect(200, done);
        });
    });

    importTest('/user', './routes.user.js');
    importTest('/dashboard', './routes.dashboard.js');

});
