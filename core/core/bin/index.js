#!/usr/bin/env node
const importLocal = require('import-local')
const npmlog = require('npmlog')
// console.log('nh',__filename)
// 为什么不是执行的本地的脚手架
// 因为本地脚手架执行了npm link
// 所以找的是node下的包
if(importLocal(__filename)){
    npmlog.info('core', '执行的是本地的starfish-cli')
}else{
    require('../lib')(process.argv.slice(2))
}