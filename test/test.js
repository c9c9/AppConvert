//运行这个测试

let builder = require('../src/builder');
let config = require('./app.convert.config')
let PATH = require('path')
builder.build(builder.configMake(config, './', './', ["src",".git"], [], PATH))

//cmd
// lac --project="./" build ./src ./.git