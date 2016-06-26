'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    settings  = []

exports.setup = function() {

  inquirer.prompt([
  {
    type: 'list',
    name: 'region',
    message: 'Please select Region for API Gatway',
    choices: [ 'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-northeast-1' ]}
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
      functions.push(f.FunctionName)
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
    console.log(settings)
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
