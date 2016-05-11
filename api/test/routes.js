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
        it('should return 200 OK', function() {
            return chai.request(url).get('/status').end(function(err, res) {
                expect(res).should.have.status(200);
                expect(res.body).should.be.json;
                expect(res.body.success).should.equal(1);
            });
        });
    });

    importTest('/user', './routes.user.js');
    importTest('/dashboard', './routes.dashboard.js');

});
