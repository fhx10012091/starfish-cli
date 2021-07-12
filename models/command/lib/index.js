'use strict';
const semver = require('semver')
const colors = require('colors')
const log = require('@starfish-cli/log')
const {isObject} = require('@starfish-cli/utils')
const LOWEST_NODE_VERSION = '14.0.0'

class Command {
    constructor(argv) {
        if(!argv){
            throw new Error('参数不能为空!')
        }
        if(!Array.isArray(argv)){
            throw new Error('参数必须为数组!')
        }
        if(argv.length < 1){
            throw new Error('参数列表为空!')
        }
        this._argv = argv
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVersion())
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init())
            chain = chain.then(() => this.exec())
            chain.catch(err => {
                log.error(err.message)
            })
        })
    }
    // 检查Node的版本
    checkNodeVersion() {
        // 当前node的版本
        let currentNodeVersion = process.version
        // 最低node版本
        let lowerNodeVersion = LOWEST_NODE_VERSION
        if (!semver.gte(currentNodeVersion, lowerNodeVersion)) {
            throw new Error(colors.red(`starfish-cli 需安装 v${lowerNodeVersion} 以上版本的node.js`))
        }
    }
    initArgs(){
        this._cmd = this._argv[this._argv.length - 1]
        this._argv = this._argv.slice(0, this._argv.length -1)
    }
    init() {
        throw new Error('init需安装')
    }
    exec() {
        throw new Error('exec需安装')
    }
}

module.exports = Command;
