'use strict';

const log = require('npmlog')

log.level = process.env.LOG_LEVEL?process.env.LOG_LEVEL:'info'
log.addLevel('success', 2000, { fg: 'green',blod: true })
log.heading = 'starfish'
log.headingStyle = { fg: 'red', bg: 'white' }

module.exports = log;
