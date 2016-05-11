var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version;

function importTest(name, path) {
    describe(name, function() {
        require(path);
    });
}

describe(version, function() {

    describe('GET /status', function() {
        it('should return 200 OK', function done() {
            chai.request(url).get('/status').end(function(err, res) {
                expect(res).should.have.status(200);
                expect(res).should.be.json;
                expect(res.body.success).should.equal(1);
                done();
            });
        });
    });

    describe('/dashboard', function() {
        var routeURL = url + '/dashboard';

        describe('GET /', function() {
            it('should have the an arry of the dashboards contents', function(done) {
                chai.request(routeURL).get('/').end(function(err, res) {
                    expect(res).should.have.status(200);
                    expect(res).should.be.json;
                    expect(res.body.success).should.equal(1);
                    done();
                });
            });
        });
    });

    describe('/user', function() {
        var routeURL = url + '/user';

        describe('POST /authenticate', function() {
            it('should return error when provided an empty body', function(done) {
                chai.request(url).post('/authenticate').end(function(err, res) {
                    expect(res).should.have.status(200);
                    expect(res).should.be.json;
                    expect(res.body.success).should.equal(1);
                    expect(res.body.result.username).should.equal(config.test.login.username);
                    done();
                });
            });
        });
    });

});
