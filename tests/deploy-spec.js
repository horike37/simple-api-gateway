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
    
    apigw = new apiDeploy()
  })
  
  it('setRegion', function(done) {
    apigw.setRegion(config.region).then(function(res) {
      (typeof res).should.be.equal('undefined')
      done()
    })
  })
  
  it('setApiList', function(done) {
    apigw.setAPIGateway().then(function(res) {
      return apigw.setApiList()
    }).then(function(res) {
      let api = _.filter(apigw.q.apiName.choices, { 'value': config.apiid })
      api[0].name.should.equal(config.apiname)
      api[0].value.should.equal(config.apiid)
      done()
    })
  })
  
  it('setStageList', function(done) {
    apigw.setAPIGateway().then(function(res) {
      return apigw.setStageList(config.apiid)
    }).then(function() {
      apigw.q.listStageName.choices[0].should.equal(config.stageName)
      done()
    })
  })

  it('isStages', function(done) {
    apigw.setAPIGateway().then(function(res) {
      return apigw.isStages(config.apiid)
    }).then(function(res) {
      res.should.be.true
      done()
    })
  })
  
  it('createDeployment', function(done) {
    apigw.setAPIGateway().then(function(res) {
      return apigw.createDeployment(config.apiid, config.stageName)
    }).then(function(res) {
      res.should.be.equal('createDeployment sucess')
      done()
    })
  })
})