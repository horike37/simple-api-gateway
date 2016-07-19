# Simple API Gateway
[![Build Status](https://travis-ci.org/horike37/simple-api-gateway.svg?branch=master)](https://travis-ci.org/horike37/simple-api-gateway)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

API Gateway is awsome service in Amazon Web Services. But It is a little difficult setting, because setting item is many.
This module provide to easy interactive setting for API Gateway. Very easy. Very simple.
<img src="https://raw.githubusercontent.com/horike37/simple-api-gateway/sample/samplescreen-1.gif" />

## Install

    $ npm install -g simple-api-gateway

## Setup(AWS-CLI)
You need AWS-CLI.

    $ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    $ brew install wget
    $ brew install awscli

And please setup AWS-CLI's configure

    $ aws configure

## How to use
Create API.

    $ apigw create

Edit API.

    $ apigw edit

Deploy and Publish API.

    $ apigw deploy

Delete API.

    $ apigw delete

## Client Code Examples
### Use jQuery Ajax on browsers

    JQuery(document).ready(function(){
      JQuery.post("<your API Endpoint>",
        '{ "say" : "hello" }',
        function(data){
          console.log(data)
        },
        "json"
      )
    })
