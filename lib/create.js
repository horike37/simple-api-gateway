'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    settings  = [],
    api       = [],
    apigateway

exports.action = function() {

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
    apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
    let params = {
          name: settings['apiname']
        }
    return apigateway.createRestApi(params).promise()
  }).then(function(res) {
    console.log('API Create Success!! Please action `apigw edit` and set up API')
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
