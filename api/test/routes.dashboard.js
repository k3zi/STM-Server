var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/dashboard';

describe('GET /', function() {
    it('should have the an arry of the dashboards contents', function(done) {
        chai.request(url).get('/').end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.success.should.equal(1);
            done();
        });
    });
});
