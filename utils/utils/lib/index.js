'use strict';

module.exports = {
    isObject,
    spinnerStart,
    sleep
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