#!/usr/bin/env node
const importLocal = require('import-local')
const npmlog = require('npmlog')
// console.log('nh',__filename)
if(importLocal(__filename)){
    npmlog.info('core', '执行的是本地的starfish-cli')
}else{
    require('../lib')(process.argv.slice(2))
}