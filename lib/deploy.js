'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')


class Question {
  constructor(region) {

    this.region = {
      type   : 'list',
      name   : 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.apiName = { 
      type   : 'list',
      name   : 'id',
      message: 'Please input API Name',
      choices: []
    }
    
    this.stageSelect = { 
      type   : 'list',
      name   : 'stageSelect',
      message: 'Do you want to use an existing Stage or create a new one?',
      choices: [ 'Existing Stage', 'Create A New Stage' ]
    } 
    
    this.listStageName = { 
      type   : 'list',
      name   : 'stageName',
      message: 'Please select target Stage',
      choices: []
    }
    
    this.inputStageName = { 
      type   : 'input',
      name   : 'stageName',
      message: 'Please input Stage Name'
    }
  }
}
module.exports.question = Question

class ApiGateway {
  constructor(region) {
    this.region = region
  
    aws.config.update({region:region})
    this.apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
  }
  
  getApiList() {
    let params = {}

    return this.apigateway.getRestApis(params).promise().then(function(res) {
      let selected = []
      res.items.forEach(function(f){
        selected.push({name:f.name,value:f.id})
      })
      return selected
    })
  }
  
  getStageList(apiId) {
    let params = {
      restApiId: apiId
    }
    return this.apigateway.getStages(params).promise().then(function(res) {
      let selected = []
      res.item.forEach(function(f){
        selected.push(f.stageName)
      })
      return selected
    })
  }
  
  isStages(apiId) {
    let params = {
      restApiId: apiId
    }
    return this.apigateway.getStages(params).promise().then(function(res) {
      if (res.item.length > 0) {
        return true
      } else {
        return false
      }
    })
  }
  
  createDeployment(apiId, stageName) {
    let params = {
      restApiId: apiId,
      stageName: stageName
    }
    return this.apigateway.createDeployment(params).promise()
  }
}
module.exports.apigateway = ApiGateway

module.exports.action = function() {
  let q = new Question(),
      apigw,
      apiId,
      stageName

  inquirer.prompt([q.region]).then(function(answers) {
    apigw = new ApiGateway(answers.region)
  }).then(function() { 
    return apigw.getApiList()
  }).then(function(res) {
    q.apiName.choices = res
    return inquirer.prompt([q.apiName])
  }).then(function(answers) {
    apiId = answers.id
    return apigw.isStages(apiId)
  }).then(function(isStages) {
    if (isStages) {
      return inquirer.prompt([q.stageSelect]).then(function(answers){
        if (answers.stageSelect === 'Existing Stage') {
          return apigw.getStageList(apiId).then(function(res){
            q.listStageName.choices = res
            return inquirer.prompt([q.listStageName])
          }).then(function(answers){
            stageName = answers.stageName
          })
        } else {
          return inquirer.prompt(q.inputStageName).then(function(answers){
            stageName = answers.stageName
          })
        }
      })
    } else {
      return inquirer.prompt(aq.inputStageName).then(function(answers){
        stageName = answers.stageName
      })
    }
  }).then(function() {
    return apigw.createDeployment(apiId, stageName)
  }).then(function(res) {
    console.log('Deploy success! Endpoint:https://'+apiId+'.execute-api.'+apigw.region+'.amazonaws.com/'+stageName)
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
