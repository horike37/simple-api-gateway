'use strict'

var chai      = require('chai'),
    bddStdin  = require('bdd-stdin'),
    inquirer  = require('inquirer'),
    aws       = require('aws-sdk'),
    create    = require('../lib/create'),
    should    = chai.should()
  
describe('API Create Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  it('Create action test', function(done) {
    let apigw = new create()
  
    bddStdin(bddStdin.keys.down, '\n')
    inquirer.prompt([apigw.q.region]).then(function(answers) {
      answers.region.should.equal('ap-northeast-1')
      return apigw.setRegion(answers.region)
    }).then(function() {
      bddStdin('awsomeapi', '\n')
      return inquirer.prompt([apigw.q.apiname])
    }).then(function(answers) {
      answers.name.should.equal('awsomeapi')
      return apigw.createRestApi(answers.name)
    }).then(function(res) {
      process.exit()
      done()
    })
  })
})