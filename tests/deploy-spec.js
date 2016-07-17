'use strict'

var chai      = require('chai'),
    aws       = require('aws-sdk-mock'),
    apiDeploy = require('../lib/deploy'),
    config    = require('./config'),
    _         = require('lodash'),
    should    = chai.should(),
    apigw
    
describe('API Deploy Tests', function() {

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
    
    aws.mock('APIGateway', 'getStages', function (params, callback){
      let result = {
        item:[{ 
          stageName: config.stageName
        }]
      }
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'createDeployment', function (params, callback){
      callback(null, 'createDeployment sucess');
    })
    
    apigw = new apiDeploy.apigateway(config.region)
  })
  
  it('getApiList', function(done) {
    apigw.getApiList().then(function(res) {
      res[0].name.should.equal(config.apiname)
      res[0].value.should.equal(config.apiid)
      done()
    })
  })
  
  it('getStageList', function(done) {
    apigw.getStageList(config.apiid).then(function(res) {
      res[0].should.equal(config.stageName)
      done()
    })
  })

  it('isStages', function(done) {
    apigw.isStages(config.apiid).then(function(res) {
      res.should.be.true
      done()
    })
  })
  
  it('createDeployment', function(done) {
    apigw.createDeployment(config.apiid, config.stageName).then(function(res) {
      res.should.be.equal('createDeployment sucess')
      done()
    })
  })
})