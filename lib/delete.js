'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')

class Question {
  constructor() {
    
    this.region = {
      type   : 'list',
      name   : 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.apiName = {
      type   : 'list',
      name   : 'id',
      message: 'Please select API',
      choices: {}
    }
    
    this.confirm = {
      type   : 'confirm',
      name   : 'isdelete',
      message: 'May I delete the API?',
      default: false
    }
  }
}
module.exports.question = Question

class ApiGateway {
  constructor(region) {
    aws.config.update({region:region})
    this.apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
  }


  getApiList() {
    let _this = this
    let params = {}

    return _this.apigateway.getRestApis(params).promise().then(function(res) {
      let selected = []
      res.items.forEach(function(f){
        selected.push({name:f.name,value:f.id})
      })
      return selected
    })
  }

  deleteApi(apiId) {
    let params = {
      restApiId: apiId
    }
    
    return this.apigateway.deleteRestApi(params).promise()
  }
}
module.exports.apigateway = ApiGateway

module.exports.action = function() {
  let q = new Question(),
      apigw,
      apiid

  inquirer.prompt([q.region]).then(function(answers) {
    apigw = new ApiGateway(answers.region)
  }).then(function() {
    return apigw.getApiList()
  }).then(function(res) {
    q.apiName.choices = res
    return inquirer.prompt([q.apiName])
  }).then(function(answers) {
    apiid = answers.id
    return inquirer.prompt([q.confirm])
  }).then(function(answers) {
    if (answers.isdelete) {
      return apigw.deleteApi(apiid)
    }
  }).then(function(res) {
    if (typeof res === 'object') {
      console.log('API deleted sucess!!')
    } else {
      console.log('API delete cancel')
    }
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
