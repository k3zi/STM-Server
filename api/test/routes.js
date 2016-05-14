process.env.NODE_ENV = 'development';

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
        it('should return 200 OK', function(done) {
            return chai.request(url).get('/status').end(function(err, res) {
                should.equal(err, null);
                res.should.have.status(200);
                res.should.be.json;
                res.body.success.should.equal(true);
                done();
            });
        });
    });

    importTest('/comment', './routes.comment.js');
    importTest('/conversation', './routes.conversation.js');
    importTest('/dashboard', './routes.dashboard.js');
    importTest('/search', './routes.search.js');
    importTest('/stream', './routes.stream.js');
    importTest('/user', './routes.user.js');

});
