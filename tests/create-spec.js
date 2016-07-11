'use strict'

var chai   = require('chai'),
    aws    = require('aws-sdk'),
    create = require('../lib/create'),
    config = require('./config'),
    should = chai.should()
  
describe('API Create Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  it('Create action test', function(done) {
    let apigw = new create()
  
    apigw.setRegion(config.region).then(function() {
      return apigw.createRestApi(config.apiname)
    }).then(function(res) {
      res.name.should.equal(config.apiname)
      done()
    })
  })
})