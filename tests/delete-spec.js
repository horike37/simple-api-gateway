'use strict'

var chai      = require('chai'),
    aws       = require('aws-sdk-mock'),
    apiDelete = require('../lib/delete'),
    config    = require('./config'),
    _         = require('lodash'),
    should    = chai.should(),
    apigw
  
describe('API Delete Tests', function() {
  beforeEach(function() {
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
      callback(null, 'delete success')
    })
   
    apigw = new apiDelete.apigateway(config.region)
  })
  
  it('getApiList', function(done) {
    apigw.getApiList().then(function(res) {
      res[0].name.should.equal(config.apiname)
      res[0].value.should.equal(config.apiid)
      done()
    })
  })
  
  it('deleteApi', function(done) {
    apigw.deleteApi().then(function(res) {
      res.should.equal('delete success')
      done()
    })
  })
})