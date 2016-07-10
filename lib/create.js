'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')

class Create {
  constructor() {
    this.q = {
      region: {},
      apiname: {}
    }

    this.q.region = {
      type: 'list',
      name: 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.q.apiname = { 
      type: 'input',
      name: 'name',
      message: 'Please input API Name'
    }
    
    this.apigateway = {}
  }
  
  setRegion(region) {
    let _this = this
    
    return new Promise(function(resolve, reject){
      aws.config.update({region:region})
      _this.apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
      resolve()
    })
  }
  
  createRestApi(apiname) {
    let params = {
      name: apiname
    }   
    return this.apigateway.createRestApi(params).promise()
  }
}
module.exports = Create

module.exports.action = function() {
  let apigw = new Create()
  
  inquirer.prompt([apigw.q.region]).then(function(answers) {
    return apigw.setRegion(answers.region)
  }).then(function() {
    return inquirer.prompt([apigw.q.apiname])
  }).then(function(answers) {
    return apigw.createRestApi(answers.name)
  }).then(function(res) {
    console.log('API Create Success!! Please action `apigw edit` and set up API')
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  })
}

