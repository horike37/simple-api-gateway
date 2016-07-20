'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    apigateway,
    lambda,
    response,
    settings  = {
                  region  :'',
                  api_id  :'',
                  api_name:'',
                  enableCORS:false,
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
                  },
                  mappingTemplate:`
#define( $loop ) 
  { 
  #foreach($key in $map.keySet()) 
    "$util.escapeJavaScript($key)":
    "$util.escapeJavaScript($map.get($key))"

    #if( $foreach.hasNext ) , #end
  #end 
  } 
#end
{ 
  "body": $input.json("$"),
  "method": "$context.httpMethod",

  #set( $map = $input.params().header ) 
  "headers": $loop, 
  
  #set( $map = $input.params().querystring )
  "query": $loop,

  #set( $map = $input.params().path )
  "path": $loop,
  
  #set( $map = $context.identity )
  "identity": $loop,
  
  #set( $map = $stageVariables )
  "stageVariables": $loop
`
                }

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
      message: 'Please input API Name',
      choices: []
    }

    this.selectResourceEdit = { 
      type   : 'list',
      name   : 'selectResourceEdit',
      message: 'Do you want to use an existing Resources or create a new one?',
      choices: [ 'Existing Resources', 'Create A New Resouce' ]
    }

    this.selectParentResource = { 
      type   : 'list',
      name   : 'id',
      message: 'Please select parent Resource',
      choices: []
    }

    this.selectEditResource = { 
      type   : 'list',
      name   : 'id',
      message: 'Please select Edit Resource',
      choices: []
    }

    this.inputResourceName = { 
      type   : 'input',
      name   : 'resourceName',
      message: 'Please input Resouce Path'
    }

    this.selectMethod = {
      type   : 'list',
      name   : 'method',
      message: 'Please select method',
      choices: [ 'GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD' ]
    }

    this.selectLambdaFunction = {
      type   : 'list',
      name   : 'function',
      message: 'Please select backend lambda function',
      choices: []
    }

    this.enableCors = {
      type   : 'confirm',
      name   : 'enableCors',
      message: 'May I set enable CORS?',
      default: false
    }

    this.confirm = {
      type   : 'confirm',
      name   : 'iscreate',
      message: 'May I create the API?',
      default: false
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

  getResources(apiId) {
    let params = {
      restApiId:apiId
    }
    
    return this.apigateway.getResources(params).promise().then(function(res) {
      let selected = []
      res.items.forEach(function(f){
        selected.push({name:f.path,value:f.id})
      })
      return selected
    })
  }

  createResource(parentId, pathPart, restApiId) {
    let params = {
      parentId : parentId,
      pathPart : pathPart,
      restApiId: restApiId
    }

    return this.apigateway.createResource(params).promise().then(function(res) {
      return res.id
    })
  }
  
  updateMethod(httpMethod, resourceId, restApiId) {
    let _this  = this
    let params = {
      resourceId: resourceId,
      restApiId : restApiId
    }

    return _this.apigateway.getResource(params).promise().then(function(res) {
      if (!res.resourceMethods.hasOwnProperty(httpMethod)) {
        let params = {
          authorizationType: 'NONE',
          httpMethod       : httpMethod,
          resourceId       : resourceId,
          restApiId        : restApiId
        }
        return _this.apigateway.putMethod(params).promise()
      }
    })
  }
}
module.exports.apigateway = ApiGateway

class Lambda {
  constructor(region) {
    this.region = region
  
    aws.config.update({region:region})
    this.lambda = new aws.Lambda({apiVersion: '2015-03-31'})
  }
  
  listFunctions() {
    return this.lambda.listFunctions().promise().then(function(res) {
      let selected = []
      res.Functions.forEach(function(f){
        selected.push({name:f.FunctionName,value:f.FunctionArn})
      })
      return selected
    })
  }
}

exports.action = function() {
  let q = new Question(),
      apigw,
      lambda,
      region,
      apiId,
      selectResourceEdit,
      parentResourceId,
      editResourceId,
      resourceName,
      httpMethod,
      enableCORS
      

  inquirer.prompt([q.region]).then(function(answers) {
    region = answers.region
    apigw  = new ApiGateway(region)
  }).then(function() { 
    return apigw.getApiList()
  }).then(function(res) {
    q.apiName.choices = res
    return inquirer.prompt([q.apiName])
  }).then(function(answers) { 
    apiId = answers.id
    return inquirer.prompt([q.selectResourceEdit])
  }).then(function(answers) {
    selectResourceEdit = answers.selectResourceEdit
    if (answers.selectResourceEdit === 'Create A New Resouce') {
      return apigw.getResources(apiId).then(function(res){
        q.selectParentResource.choices = res
        return inquirer.prompt([q.selectParentResource])
      }).then(function(answers){
        parentResourceId = answers.id
        return inquirer.prompt([q.inputResourceName])
      }).then(function(answers){
        resourceName = answers.resourceName
      })
    } else {
      return apigw.getResources(apiId).then(function(res){
        q.selectEditResource.choices = res
        return inquirer.prompt([q.selectEditResource])
      }).then(function(answers){
        editResourceId = answers.id
      })
    }
  }).then(function() {
    return inquirer.prompt([q.selectMethod])
  }).then(function(answers) {
    httpMethod = answers.method
    lambda = new Lambda(region)
    return lambda.listFunctions()
  }).then(function(res) {
    q.selectLambdaFunction.choices = res
    return inquirer.prompt([q.selectLambdaFunction])
  }).then(function() {
    return inquirer.prompt([q.enableCors])
  }).then(function(answers) {
    enableCORS = answers.enableCORS
    return inquirer.prompt([q.confirm])
  }).then(function(answers) {
    if (!answers.iscreate) {
      return Promise.resolve('Cancel API editting')
    }

    if (selectResourceEdit === 'Create A New Resouce') {
      return apigw.apigateway.createResource(parentResourceId, resourceName, apiId).then(function(res) {
        editResourceId = res.id
      })
    }
  }).then(function(res) {
    return apigw.updateMethod(httpMethod, editResourceId, apiId)
  }).then(function(res) {
    console.log(res)
  }).then(function(res) {
    if (settings['enableCORS']) {
      let params = {
        resourceId       : settings.resource.id,
        restApiId        : settings.api_id
      }
       
      apigateway.getResource(params).promise().then(function(res) {
        if (typeof res.resourceMethods.OPTIONS === 'undefined') {
          let params = {
            authorizationType: 'NONE',
            httpMethod       : 'OPTIONS',
            resourceId       : settings.resource.id,
            restApiId        : settings.api_id
          }
      
          apigateway.putMethod(params).promise().then(function(res) {
            let params = {
              httpMethod           : 'OPTIONS',
              resourceId           : settings.resource.id,
              restApiId            : settings.api_id,
              type                 : 'MOCK',
              passthroughBehavior  : 'WHEN_NO_TEMPLATES',
              requestTemplates     : {
                'application/json' : '{"statusCode": 200}'
              }
            }
            return apigateway.putIntegration(params).promise()
          }).then(function(res) {
            let params = {
              httpMethod: 'OPTIONS',
              resourceId: settings.resource.id,
              restApiId : settings.api_id,
              statusCode: '200',
              responseModels:{'application/json':'Empty'},
              responseParameters: {
                  'method.response.header.Access-Control-Allow-Headers': true,
                  'method.response.header.Access-Control-Allow-Methods': true,
                  'method.response.header.Access-Control-Allow-Origin': true
              }
            }
            return apigateway.putMethodResponse(params).promise()
          }).then(function(res) {
            let allowMethods = 'GET,POST,DELETE,PUT,PATCH,HEAD,OPTIONS'
            let params = {
              httpMethod: 'OPTIONS',
              resourceId: settings.resource.id,
              restApiId : settings.api_id,
              statusCode: '200',
              responseTemplates:{'application/json':settings.mappingTemplate},
              responseParameters: {
                'method.response.header.Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'',
                'method.response.header.Access-Control-Allow-Methods': '\''+ allowMethods +'\'',
                'method.response.header.Access-Control-Allow-Origin': '\'*\''
              }
            }
            return apigateway.putIntegrationResponse(params).promise()
          })
        }
      })
    } 
  }).then(function(res) {
    let params = {
          httpMethod           : settings.method,
          resourceId           : settings.resource.id,
          restApiId            : settings.api_id,
          type                 : 'AWS',
          integrationHttpMethod: 'POST',
          requestTemplates     : {'application/json':settings.mappingTemplate},
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
      if (settings['enableCORS']) {
          params['responseParameters'] = {
              'method.response.header.Access-Control-Allow-Origin': true
          }
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
      if (settings['enableCORS']) {
          params['responseParameters'] = {
              'method.response.header.Access-Control-Allow-Origin': '\'*\''
          }
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
