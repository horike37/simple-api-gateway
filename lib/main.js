'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    settings  = [],
    api       = [],
    apigateway

exports.setup = function() {

  inquirer.prompt([
  {
    type: 'list',
    name: 'region',
    message: 'Please select Region for API Gatway',
    choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]}
  ]).then(function(answers) {
    settings['region'] = answers.region
    aws.config.update({region:answers.region})
    return inquirer.prompt([
             { 
               type: 'input',
               name: 'apiname',
               message: 'Please input API Name'
             }   
           ])
  }).then(function(answers) {
    settings['apiname'] = answers.apiname
    return inquirer.prompt([
             { 
               type: 'input',
               name: 'resource',
               message: 'Please input API Resource'
             }   
           ])
  }).then(function(answers) {
    settings['resource'] = answers.resource
    return inquirer.prompt([
             {
               type: 'list',
               name: 'method',
               message: 'Please select method',
               choices: [ 'GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD', 'OPTIONS' ]
             }
           ])
  }).then(function(answers) {
    settings['method'] = answers.method
    let lambda = new aws.Lambda({apiVersion: '2015-03-31'})
    
    return lambda.listFunctions().promise()
  }).then(function(res) {
    let functions = []
    res.Functions.forEach(function(f){
      functions.push(f.FunctionArn)
    })
    return inquirer.prompt([
             {
               type: 'list',
               name: 'function',
               message: 'Please select backend lambda function',
               choices: functions
             }
           ])
  }).then(function(answers) {
    settings['function'] = answers.function
    return inquirer.prompt([
             {
               type: 'confirm',
               name: 'iscreate',
               message: 'May I create the API?',
               default: false
             }
           ])
  }).then(function(answers) {   
    apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
    let params = {
          name: settings['apiname']
        }
    return apigateway.createRestApi(params).promise()
  }).then(function(res) {
    api['api_id'] = res.id
    let params = {
          restApiId:api['api_id']
        }
    return apigateway.getResources(params).promise()
  }).then(function(res) {
  
    let params = {
           parentId : res.items[0].id,
           pathPart : settings['resource'],
           restApiId: api['api_id']
        }
    return apigateway.createResource(params).promise()
  }).then(function(res) {
    api['resource_id'] = res.id
    let params = {
          authorizationType: 'NONE',
          httpMethod       : settings['method'],
          resourceId       : api['resource_id'],
          restApiId        : api['api_id']
        }
    return apigateway.putMethod(params).promise()
  }).then(function(res) {
  console.log('arn:aws:apigateway:'+settings['region']+':lambda:path/2015-03-31/functions/' + settings['function'] + '/invocations')
    let params = {
          httpMethod: settings['method'],
          resourceId: api['resource_id'],
          restApiId : api['api_id'],
          type      : 'AWS',
          integrationHttpMethod: settings['method'],
          uri       : 'arn:aws:apigateway:'+settings['region']+':lambda:path/2015-03-31/functions/' + settings['function'] + '/invocations'
        }
    return apigateway.putIntegration(params).promise()
  }).then(function(res) {
    console.log('API Create Success!!')
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
