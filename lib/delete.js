'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk')

class Delete {
  constructor() {
    this.q = {
      region : {},
      apiname: {},
      confirm: {}
    }
    
    this.q.region = {
      type   : 'list',
      name   : 'region',
      message: 'Please select Region for API Gatway',
      choices: [ 'us-east-1', 'ap-northeast-1', 'us-west-2', 'eu-west-1', 'eu-central-1' ]
    }
    
    this.q.apiname = {
      type   : 'list',
      name   : 'id',
      message: 'Please select API',
      choices: {}
    }
    
    this.q.confirm = {
      type   : 'confirm',
      name   : 'isdelete',
      message: 'May I delete the API?',
      default: false
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

  setDeleteApiList() {
    let _this = this
    let params = {
      limit: 0
    }

    return _this.apigateway.getRestApis(params).promise().then(function(res) {
      let selected = []
      res.items.forEach(function(f){
        selected.push({name:f.name,value:f.id})
      })
      _this.q.apiname.choices = selected
    })
  }

  deleteApi(id) {
    let params = {
      restApiId: id
    }
    
    return this.apigateway.deleteRestApi(params).promise()
  }
}
module.exports = Delete

exports.action = function() {
  let apigw = new Delete(),
      apiid

  inquirer.prompt([apigw.q.region]).then(function(answers) {
    return apigw.setRegion(answers.region)
  }).then(function() {
    return apigw.setDeleteApiList()
  }).then(function() {
    return inquirer.prompt([apigw.q.apiname])
  }).then(function(answers) {
    apiid = answers.id
    return inquirer.prompt([apigw.q.confirm])
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
