'use strict';

var inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    mappingTemplate = `

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
            }
          
`

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
  
  isOptionsMethod(resourceId, restApiId) {
    let _this  = this
    let params = {
      resourceId: resourceId,
      restApiId : restApiId
    }

    return _this.apigateway.getResource(params).promise().then(function(res) {
      if (!res.resourceMethods.hasOwnProperty('OPTIONS')) {
        return false
      } else {
        return true
      }
    })
  }
  
  createOptionsMock(resourceId, restApiId, mappingTemplate) {
    let _this  = this
    let params = {
      authorizationType: 'NONE',
      httpMethod       : 'OPTIONS',
      resourceId       : resourceId,
      restApiId        : restApiId
    }

    return _this.apigateway.putMethod(params).promise().then(function(res) {
      let params = {
        httpMethod           : 'OPTIONS',
        resourceId           : resourceId,
        restApiId            : restApiId,
        type                 : 'MOCK',
        passthroughBehavior  : 'WHEN_NO_TEMPLATES',
        requestTemplates     : {
          'application/json' : '{"statusCode": 200}'
        }
      }
      return _this.apigateway.putIntegration(params).promise()
    }).then(function(res) {
      let params = {
        httpMethod: 'OPTIONS',
        resourceId: resourceId,
        restApiId : restApiId,
        statusCode: '200',
        responseModels:{'application/json':'Empty'},
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }
      return _this.apigateway.putMethodResponse(params).promise()
    }).then(function(res) {
      let allowMethods = 'GET,POST,DELETE,PUT,PATCH,HEAD,OPTIONS'
      let params = {
        httpMethod: 'OPTIONS',
        resourceId: resourceId,
        restApiId : restApiId,
        statusCode: '200',
        responseTemplates:{'application/json':mappingTemplate},
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'',
          'method.response.header.Access-Control-Allow-Methods': '\''+ allowMethods +'\'',
          'method.response.header.Access-Control-Allow-Origin': '\'*\''
        }
      }
      return _this.apigateway.putIntegrationResponse(params).promise()
    })
  }
  
  putMethodIntegration(httpMethod, resourceId, restApiId, mappingTemplate, region, lambdaArn, enableCors) {
    let _this  = this
    let params = {
      resourceId: resourceId,
      restApiId : restApiId
    }

    return _this.apigateway.getResource(params).promise().then(function(res) {
      if (res.resourceMethods.hasOwnProperty(httpMethod)) {
        let params = {
          httpMethod: httpMethod,
          resourceId: resourceId,
          restApiId : restApiId
        }
        return _this.apigateway.deleteMethod(params).promise()
      }
    }).then(function(res) {
      let params = {
        authorizationType: 'NONE',
        httpMethod       : httpMethod,
        resourceId       : resourceId,
        restApiId        : restApiId
      }
      return _this.apigateway.putMethod(params).promise()
    }).then(function(res) {
      let params = {
        httpMethod           : httpMethod,
        resourceId           : resourceId,
        restApiId            : restApiId,
        type                 : 'AWS',
        integrationHttpMethod: 'POST',
        requestTemplates     : {'application/json':mappingTemplate},
        uri                  : 'arn:aws:apigateway:'+region+':lambda:path/2015-03-31/functions/' + lambdaArn + '/invocations'
      }
      return _this.apigateway.putIntegration(params).promise()
    }).then(function(res) {
      let params = {
        httpMethod    : httpMethod,
        resourceId    : resourceId,
        restApiId     : restApiId,
        statusCode    : '200',
        responseModels:{'application/json':'Empty'}
      }
      if (enableCors) {
        params['responseParameters'] = {
          'method.response.header.Access-Control-Allow-Origin': true
        }
      }
      return _this.apigateway.putMethodResponse(params).promise()
    }).then(function(res) {
      let params = {
        httpMethod: httpMethod,
        resourceId: resourceId,
        restApiId : restApiId,
        statusCode: '200',
        responseTemplates:{'application/json':''}
      }
      if (enableCors) {
        params['responseParameters'] = {
          'method.response.header.Access-Control-Allow-Origin': '\'*\''
        }
      }
      return _this.apigateway.putIntegrationResponse(params).promise()
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

  addPermission(lambdaArn, region, restApiId, httpMethod, resourceName) {
    let accountId = lambdaArn.replace('arn:aws:lambda:'+region+':', '').split(':')[0]
    let params = {
      Action      : 'lambda:InvokeFunction',
      FunctionName: lambdaArn,
      Principal   : 'apigateway.amazonaws.com',
      StatementId : Math.random().toString(36).slice(-8),
      SourceArn   :'arn:aws:execute-api:'+region+':'+accountId+':'+restApiId+'/*/'+httpMethod+'/'+resourceName
    }
    return this.lambda.addPermission(params).promise()
  }
}
module.exports.lambda = Lambda

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
      enableCors,
      lambdaArn

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
  }).then(function(answers) {
    lambdaArn = answers.function
    return inquirer.prompt([q.enableCors])
  }).then(function(answers) {
    enableCors = answers.enableCors
    return inquirer.prompt([q.confirm])
  }).then(function(answers) {
    if (!answers.iscreate) {
      return Promise.reject(new Error('Cancel API editting'))
    }

    if (selectResourceEdit === 'Create A New Resouce') {
      return apigw.apigateway.createResource(parentResourceId, resourceName, apiId).then(function(res) {
        editResourceId = res.id
      })
    }
  }).then(function(res) {
    if (enableCors) {
      return apigw.isOptionsMethod(editResourceId, apiId).then(function(res) {
        if ( !res ) {
          return apigw.createOptionsMock(editResourceId, apiId, mappingTemplate)
        }
      })
    }
  }).then(function() {
    return apigw.putMethodIntegration(httpMethod, editResourceId, apiId, mappingTemplate, region, lambdaArn, enableCors)
  }).then(function() {
    return lambda.addPermission(lambdaArn, region, apiId, httpMethod, resourceName)
  }).then(function(res) {
    if (typeof res === 'object') {
      console.log('Create Success!! Resource and Method on API. Please API deploy using `apigw deploy`')
    }
  }).catch(function rejected(err) {
    console.log('error:', err.stack)
  }) 
}
