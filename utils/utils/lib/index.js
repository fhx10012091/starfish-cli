'use strict';

module.exports = {
    isObject,
    spinnerStart,
    sleep,
    spawn,
    spawnAsync
};

function isObject(o) {
    // TODO
    return Object.prototype.toString.call(o) === '[object Object]'
}

function spinnerStart(msg, spinnerString = '|/-\\'){
    const Spinner = require('cli-spinner').Spinner
    const spinner = new Spinner(msg + ' %s')
    spinner.setSpinnerString(spinnerString)
    spinner.start(true)
    return spinner
}
function sleep(timeout = 1000){
    return new Promise(resolve => setTimeout(resolve, timeout))
}

function spawn(command, args, options){
    const win32 = process.platform == 'win32'
    const cmd = win32 ? 'cmd' : command
    const cmdArgs = win32 ? ['/c'].concat(command, args):args
    return require('child_process').spawn(cmd, cmdArgs, options || {})
}

function spawnAsync(command, args, options){
    return new Promise((resolve, reject) => {
        const p = spawn(command, args, options)
        p.on('error', e => {
            reject(e)
        })
        p.on('exit', c => {
            resolve(c)
        })
    })
}