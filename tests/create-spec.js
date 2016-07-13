'use strict'

var chai       = require('chai'),
    aws        = require('aws-sdk-mock'),
    create     = require('../lib/create'),
    config     = require('./config'),
    should     = chai.should()
  
describe('API Create Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  it('Create action test', function(done) {
    aws.mock('APIGateway', 'createRestApi', function (params, callback){
      let result = { 
        id: config.apiid,
        name: config.apiname,
        createdDate: Date.now() 
      }
    
      callback(null, result);
    })
   
    let apigw = new create()
    

    apigw.setRegion(config.region).then(function(res) {
      return apigw.createRestApi(config.apiname)
    }).then(function(res) {
      res.name.should.equal(config.apiname)
      done()
    })
  })
})
