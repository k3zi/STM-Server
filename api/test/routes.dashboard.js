var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var chaiHttp = require('chai-http');
var winston = require('winston');
var config = require('../config/dev');

chai.use(chaiHttp);

var version = config.versions[config.versions.length - 1];
var url = config.baseURL + version + '/dashboard';

describe('GET /', function() {
    it('should have the an array of the dashboards contents', function() {
        return chai.request(url).get('/').end(function(err, res) {
            expect(res).should.have.status(200);
            expect(res.body).should.be.json;
            expect(res.body.success).should.equal(1);
        });
    });
});
