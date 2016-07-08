'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    response,
    apigateway,
    settings  = {
                  region  :'',
                  api_id  :'',
                  api_name:'',
                  stage:{
                    name  :''
                  }
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
    let params = {
          restApiId: settings['api_id']
        }
    return apigateway.getStages(params).promise()
  }).then(function(res) {
    if (res.item.length > 0) {
      response = res.item
      return inquirer.prompt([
               { 
                 type: 'list',
                 name: 'how_to_edit_stage',
                 message: 'Do you want to use an existing Stage on '+settings['api_name']+'or create a new one?',
                 choices: [ 'Existing Stage', 'Create A New Stage' ]
               }   
             ]).then(function(answers){
               if (answers.how_to_edit_stage === 'Existing Stage') {
                 let selected = []
                 
                 response.forEach(function(f){
                   selected.push(f.stageName)
                 })
                 
                 return inquirer.prompt([
                        { 
                          type: 'list',
                          name: 'stage_name',
                          message: 'Please select target Stage',
                          choices: selected
                        }
                      ]).then(function(answers){
                        settings['stage']['name'] = answers.stage_name
                      })
               } else if (answers.how_to_edit_stage === 'Create A New Stage') {
                 return inquirer.prompt([
                        { 
                          type: 'input',
                          name: 'stage_name',
                          message: 'Please input Stage Name'
                        }
                      ]).then(function(answers){
                        settings['stage']['name'] = answers.stage_name
                      })
               }
             })
    } else {
      return inquirer.prompt([
                        { 
                          type: 'input',
                          name: 'stage_name',
                          message: 'Please input Stage Name'
                        }
                      ]).then(function(answers){
                        settings['stage']['name'] = answers.stage_name
                      })
    }
  }).then(function(res) {
    let params = {
                   restApiId: settings.api_id,
                   stageName: settings.stage.name,
                 }
    return apigateway.createDeployment(params).promise()
  }).then(function(res) {
    console.log('Deploy success! Endpoint:https://'+settings.api_id+'.execute-api.'+settings.region+'.amazonaws.com/'+settings.stage.name)
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
