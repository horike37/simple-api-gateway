'use strict'

var chai      = require('chai'),
    aws       = require('aws-sdk-mock'),
    apiEdit   = require('../lib/edit'),
    config    = require('./config'),
    _         = require('lodash'),
    should    = chai.should(),
    apigw,
    lambda

describe('API Edit Tests', function() {
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
    
    aws.mock('APIGateway', 'getResource', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'getResources', function (params, callback){
      let result = {
        items: [{ 
          id: config.resourceId, 
          path: config.pathPart, 
          resourceMethods: {
            'GET':{}
          } 
        }]
      }
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'createResource', function (params, callback){
      let result = { 
        id      : config.resourceId,
        parentId: config.parentResourceId,
        pathPart: config.pathPart,
        path    : config.path
      }
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'putMethod', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'putIntegration', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'putMethodResponse', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'putIntegrationResponse', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('APIGateway', 'deleteMethod', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('Lambda', 'listFunctions', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    aws.mock('Lambda', 'addPermission', function (params, callback){
      let result = {}
      callback(null, result)
    })
    
    apigw  = new apiEdit.apigateway(config.region)
    lambda = new apiEdit.lambda(config.region)
  })
  
  it('getApiList', function(done) {
    apigw.getApiList().then(function(res) {
      res[0].name.should.equal(config.apiname)
      res[0].value.should.equal(config.apiid)
      done()
    })
  })

  it('getResources', function(done) {
    apigw.getResources(config.apiid).then(function(res) {
      res[0].name.should.equal(config.pathPart)
      res[0].value.should.equal(config.resourceId)
      done()
    })
  })
  
  it('createResource', function(done) {
   apigw. createResource(config.parentResourceId, config.pathPart, config.apiid).then(function(res) {
     res.id.should.equal(config.resourceId)
     res.parentId.should.equal(config.parentResourceId)
     res.pathPart.should.equal(config.pathPart)
     res.path.should.equal(config.path)
     done()
   })
  })
})