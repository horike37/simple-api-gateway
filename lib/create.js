'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')

class Question {
  constructor(region) {

    this.region = {
      type: 'list',
      name: 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.apiName = { 
      type: 'input',
      name: 'name',
      message: 'Please input API Name'
    }
  }
}
module.exports.question = Question

class ApiGateway {
  constructor(region) {    
    aws.config.update({region:region})
    this.apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
  }
  
  createRestApi(apiName) {
    let params = {
      name       : apiName,
      description: 'A REST API made by Simple API Gateway'
    }
  
    return this.apigateway.createRestApi(params).promise()
  }
}
module.exports.apigateway = ApiGateway

module.exports.action = function() {
  let apigw,
      q = new Question()
  
  inquirer.prompt([q.region]).then(function(answers) {
    apigw = new ApiGateway(answers.region)
  }).then(function() {
    return inquirer.prompt([q.apiName])
  }).then(function(answers) {
    return apigw.createRestApi(answers.name)
  }).then(function(res) {
    console.log('API Create Success!! Please action `apigw edit` and set up API')
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  })
}

