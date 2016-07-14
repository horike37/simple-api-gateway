'use strict'

var chai       = require('chai'),
    aws        = require('aws-sdk-mock'),
    create     = require('../lib/create'),
    config     = require('./config'),
    should     = chai.should(),
    apigw
  
describe('API Create Tests', function() {
  beforeEach(function() {
    aws.mock('APIGateway', 'createRestApi', function (params, callback){
      let result = { 
        id: config.apiid,
        name: config.apiname,
        createdDate: Date.now() 
      }
    
      callback(null, result);
    })
   
    apigw = new create.apigateway(config.region)
  })
  
  it('createRestApi', function(done) {
    apigw.createRestApi(config.apiname).then(function(res) {
      res.name.should.equal(config.apiname)
      done()
    })
  })
})
