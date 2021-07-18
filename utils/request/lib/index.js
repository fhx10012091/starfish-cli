'use strict';
const axios = require('axios')
console.log('process.env.STARFISH_CLI_BASE_URL',process.env.STARFISH_CLI_BASE_URL)
const BASE_URL = process.env.STARFISH_CLI_BASE_URL?process.env.STARFISH_CLI_BASE_URL: 'http://127.0.0.1:7002'
axios.defaults.baseURL=BASE_URL
const request = axios.create({
    timeout: 5000
})
request.interceptors.response.use(
    response => {
        return response.data;
    },
    err => {
        return Promise.reject(err)
    }
)
module.exports = request;
