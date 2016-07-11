'use strict'

var chai      = require('chai'),
    aws       = require('aws-sdk'),
    apiDelete = require('../lib/delete'),
    config    = require('./config'),
    _         = require('lodash'),
    should    = chai.should()
  
describe('API Delete Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  it('Delete action test', function(done) {
    let apigw = new apiDelete()
  
    apigw.setRegion(config.region).then(function() {
      return apigw.setDeleteApiList()
    }).then(function(res) {
      let api = _.filter(apigw.q.apiname.choices, { 'value': config.apiid })
      api[0].name.should.equal(config.apiname)
      api[0].value.should.equal(config.apiid)
      return apigw.deleteApi(config.apiid)
    }).then(function(res) {
      res.should.be.empty
      done()
    })
  })
})