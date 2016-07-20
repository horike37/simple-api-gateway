'use strict';

describe('All Tests', function() {
  this.timeout(0)
  before(function() {})
  after(function() {})
  
  require('./create-spec')
  require('./delete-spec')
  require('./deploy-spec')
  require('./edit-spec')
})