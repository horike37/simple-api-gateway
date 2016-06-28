'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),  
    settings  = {
                  region  :'',
                  api_id  :'',
                  api_name:'',
                  resource:{
                             method   :'',
                             parent_id:'',
                             name     :'',
                             id       :''
                            },
                  method:'',
                  lambda:{
                           name:'',
                           arn :''
                         }
                },
    api       = [],
    apigateway,
    lambda,
    response

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
  }).then(function() {
    return inquirer.prompt([
             { 
               type: 'list',
               name: 'how_to_edit_resource',
               message: 'Do you want to use an existing Resources on '+settings['api_name']+'or create a new one?',
               choices: [ 'Existing Resources', 'Create A New Resouce' ]
             }   
           ])
  }).then(function(res) {
    if (res.how_to_edit_resource === 'Create A New Resouce') {
      settings['resource']['method'] = 'create'
      let params = {
            restApiId: settings['api_id']
          }
      return apigateway.getResources(params).promise().then(function(res) {
               let selected = []
               response = res.items
               response.forEach(function(f){
                 selected.push(f.path)
               })

               return inquirer.prompt([
                        { 
                          type: 'list',
                          name: 'parent_resource',
                          message: 'Please select parent Resource',
                          choices: selected,
                          filter: function (path){
                            response.forEach(function(f){
                              if ( f.path === path ) {
                                settings['resource']['parent_id'] = f.id
                              }
                            })
                          }
                        }
                      ])
             }).then(function(answers){
               return inquirer.prompt([
                        { 
                          type: 'input',
                          name: 'resource_name',
                          message: 'Please input Resouce Name'
                        }
                      ])   
             }).then(function(answers){
               settings['resource']['name'] = answers.resource_name
             })
    } else if (res.how_to_edit_resource === 'Existing Resources') {
      settings.resource['method'] = 'edit'
      let params = {
            restApiId: settings['api_id']
          }
      return apigateway.getResources(params).promise().then(function(res) {
               let selected = []
               response = res.items
               response.forEach(function(f){
                 selected.push(f.path)
               })
               
               return inquirer.prompt([
                        { 
                          type: 'list',
                          name: 'parent_resource',
                          message: 'Please select target Resource',
                          choices: selected,
                          filter: function (path){
                            response.forEach(function(f){
                              if ( f.path === path ) {
                                settings['resource']['id'] = f.id
                              }
                            })
                          }
                        }
                      ])
             })
    }
  }).then(function() {
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
    lambda = new aws.Lambda({apiVersion: '2015-03-31'})
    
    return lambda.listFunctions().promise()
  }).then(function(res) {
    let functions = []
    response = res
    response.Functions.forEach(function(f){
      functions.push(f.FunctionName)
    })
    return inquirer.prompt([
             {
               type: 'list',
               name: 'function',
               message: 'Please select backend lambda function',
               choices: functions,
               filter: function (name){
                 response.Functions.forEach(function(f){
                    if ( f.FunctionName === name ) {
                      settings.lambda.arn  = f.FunctionArn
                      settings.lambda.name = f.FunctionName
                    }
                 })
               }
             }
           ])
  }).then(function(answers) {
    return inquirer.prompt([
             {
               type: 'confirm',
               name: 'iscreate',
               message: 'May I create the API?',
               default: false
             }
           ])
  }).then(function(answers) {
    if (!answers.iscreate) {
      return Promise.resolve('Cancel API editting')
    }

    if (settings.resource.method === 'create') {
      let params = {
            parentId : settings.resource.parent_id,
            pathPart : settings.resource.name,
            restApiId: settings.api_id
          }
      return apigateway.createResource(params).promise().then(function(res) {
               settings.resource.id = res.id
             })
    }
  }).then(function(res) {
    let params = {
          authorizationType: 'NONE',
          httpMethod       : settings.method,
          resourceId       : settings.resource.id,
          restApiId        : settings.api_id
        }
    return apigateway.putMethod(params).promise()
  }).then(function(res) {
    let params = {
          httpMethod           : settings.method,
          resourceId           : settings.resource.id,
          restApiId            : settings.api_id,
          type                 : 'AWS',
          integrationHttpMethod: 'POST',
          uri                  : 'arn:aws:apigateway:'+settings.region+':lambda:path/2015-03-31/functions/' + settings.lambda.arn + '/invocations'
        }
    return apigateway.putIntegration(params).promise()
  }).then(function(res) {
    let params = {
          httpMethod: settings.method,
          resourceId: settings.resource.id,
          restApiId : settings.api_id,
          statusCode: '200',
          responseModels:{'application/json':'Empty'}
        }
    return apigateway.putMethodResponse(params).promise()
  }).then(function(res) {
    let params = {
          httpMethod: settings.method,
          resourceId: settings.resource.id,
          restApiId : settings.api_id,
          statusCode: '200',
          responseTemplates:{'application/json':''}
        }
    return apigateway.putIntegrationResponse(params).promise()
  }).then(function(res) {
    let params = {
          httpMethod: settings.method,
          resourceId: settings.resource.id,
          restApiId : settings.api_id
        }

    return apigateway.getIntegration(params).promise()
  }).then(function(res) {
    let params = {
          FunctionName: settings.lambda.name
        }
    return lambda.getFunction(params).promise()
  }).then(function(res) {
    let account_id = res.Configuration.FunctionArn.replace('arn:aws:lambda:'+settings.region+':', '').split(':')[0]
    let params = {
          Action      : 'lambda:InvokeFunction',
          FunctionName: settings.lambda.arn,
          Principal   : 'apigateway.amazonaws.com',
          StatementId : Math.random().toString(36).slice(-8),
          SourceArn   :'arn:aws:execute-api:'+settings.region+':'+account_id+':'+settings.api_id+'/*/'+settings.method+'/'+settings.resource.name
        }
    return lambda.addPermission(params).promise()
  }).then(function(res) {
    if (typeof res === 'object') {
      console.log('Create Success!! Resource and Method on '+settings.api_name+' API.')
    } else {
      console.log(res)
    }
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
