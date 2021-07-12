'use strict';

module.exports = {
    isObject
};

function isObject(o) {
    // TODO
    return Object.prototype.toString.call(o) === '[object Object]'
}
