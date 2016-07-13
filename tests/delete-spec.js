'use strict'

var chai      = require('chai'),
    aws       = require('aws-sdk-mock'),
    apiDelete = require('../lib/delete'),
    config    = require('./config'),
    _         = require('lodash'),
    should    = chai.should()
  
describe('API Delete Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  it('Delete action', function(done) {
    aws.mock('APIGateway', 'getRestApis', function (params, callback){
      let result = {
        items:[{ 
          id: config.apiid,
          name: config.apiname,
          createdDate: Date.now()
        }]
      }
      
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'deleteRestApi', function (params, callback){
      let result = {}
      callback(null, result);
    })
  
    let apigw = new apiDelete()
  
    apigw.setRegion(config.region).then(function() {
      return apigw.setApiList()
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