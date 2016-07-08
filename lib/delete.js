'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    response,
    apigateway,
    settings  = {
                  api_id  :'',
                  api_name:''
                }

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
    apigateway = new aws.APIGateway({apiVersion: '2015-07-09'})
    return apigateway.getRestApis().promise()
  }).then(function(res) {  
    let selected = []
    response = res.items
    response.forEach(function(f){
      selected.push(f.name)
    })
 
    return inquirer.prompt([
             {
               type: 'list',
               name: 'api',
               message: 'Please select API',
               choices: selected,
               filter: function (name){
                 response.forEach(function(f){
                    if ( f.name === name ) {
                      settings['api_id'] = f.id
                      settings['api_name'] = f.name
                    }
                 })
               }
             }
           ])
  }).then(function(answers) {
    return inquirer.prompt([
             {
               type: 'confirm',
               name: 'isdelete',
               message: 'May I delete the '+settings['api_name']+' API?',
               default: false
             }
           ])
  }).then(function(answers) {
    if (!answers.isdelete) {
      return Promise.resolve('Cancel API deleteing')
    }
    
    let params = {
          restApiId: settings['api_id']
        }
    return apigateway.deleteRestApi(params).promise()
  }).then(function(res) {
    if (typeof res === 'object') {
      console.log(settings['api_name']+'API deleted sucess!!')
    } else {
      console.log(res)
    }
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
