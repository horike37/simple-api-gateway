'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')

class Deploy {
  constructor() {
    this.q = {
      region         : {},
      apiName        : {},
      stageSelect    : {},
      listStageSelect: {},
      listStageName  : {},
      inputStageName : {}
    }
    
    this.q.region = {
      type   : 'list',
      name   : 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.q.apiName = {
      type   : 'list',
      name   : 'id',
      message: 'Please select API',
      choices: {}
    }
    
    this.q.stageSelect = { 
      type   : 'list',
      name   : 'stageSelect',
      message: 'Do you want to use an existing Stage or create a new one?',
      choices: [ 'Existing Stage', 'Create A New Stage' ]
    } 
    
    this.q.listStageName = { 
      type   : 'list',
      name   : 'stageName',
      message: 'Please select target Stage',
      choices: {}
    }
    
    this.q.inputStageName = { 
      type   : 'input',
      name   : 'stageName',
      message: 'Please input Stage Name'
    }
    
    this.apigateway = {}
  }
  
  setAPIGateway() {
    let _this = this
 
    return new Promise(function(resolve, reject){
      _this.apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
      resolve()
    })
  }
  
  setRegion(region) {
    let _this = this
    
    return new Promise(function(resolve, reject){
      aws.config.update({region:region})
      resolve()
    })
  }
  
  setApiList() {
    let _this = this
    let params = {}

    return _this.apigateway.getRestApis(params).promise().then(function(res) {
      let selected = []
      res.items.forEach(function(f){
        selected.push({name:f.name,value:f.id})
      })
      _this.q.apiName.choices = selected
    })
  }
  
  setStageList(apiId) {
    let _this = this
    let params = {
      restApiId: apiId
    }
    return _this.apigateway.getStages(params).promise().then(function(res) {
      let selected = []
      res.item.forEach(function(f){
        selected.push(f.stageName)
      })
      _this.q.listStageName.choices = selected
    })
  }
  
  isStages(apiId) {
    let _this = this
    let params = {
      restApiId: apiId
    }
    return _this.apigateway.getStages(params).promise().then(function(res) {
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
module.exports = Deploy

module.exports.action = function() {
  let apigw = new Deploy(),
      apiId,
      stageName,
      region

  inquirer.prompt([apigw.q.region]).then(function(answers) {
    region = answers.region
    return apigw.setRegion(answers.region)
  }).then(function() { 
    return apigw.setAPIGateway()
  }).then(function() { 
    return apigw.setApiList()
  }).then(function() {
    return inquirer.prompt([apigw.q.apiName])
  }).then(function(answers) {
    apiId = answers.id
    return apigw.isStages(apiId)
  }).then(function(isStages) {
    if (isStages) {
      return inquirer.prompt([apigw.q.stageSelect]).then(function(answers){
        if (answers.stageSelect === 'Existing Stage') {
          return apigw.setStageList(apiId).then(function(){
            return inquirer.prompt([apigw.q.listStageName])
          }).then(function(answers){
            stageName = answers.stageName
          })
        } else {
          return inquirer.prompt(apigw.q.inputStageName).then(function(answers){
            stageName = answers.stageName
          })
        }
      })
    } else {
      return inquirer.prompt(apigw.q.inputStageName).then(function(answers){
        stageName = answers.stageName
      })
    }
  }).then(function() {
    return apigw.createDeployment(apiId, stageName)
  }).then(function(res) {
    console.log('Deploy success! Endpoint:https://'+apiId+'.execute-api.'+region+'.amazonaws.com/'+stageName)
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
