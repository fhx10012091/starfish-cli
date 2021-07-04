'use strict';
const pkg = require('../package.json')
const log = require('@starfish-cli/log')
const constact = require('./const')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists')
const path = require('path')
let argv
// 脚手架的启动过程
function core() {
    // TODO
    try {
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgv()
        checkEnv()
        checkNpmInfo()
    } catch (e) {
        log.error(e.message)
    }
}

async function checkNpmInfo(){
    // 获取包名和包版本号
    let npmName = pkg.name
    let currentVersion = pkg.version

    let {getNpmSemverVersions} = require('@starfish-cli/get-npm-info')
    let newVersion = await getNpmSemverVersions(npmName, currentVersion)
    if(semver.gt(newVersion, currentVersion)){
        log.warn(colors.yellow(`请手动更新${npmName},当前版本:${currentVersion},最新版本:${newVersion},更新命令:npm i -g ${npmName}`))
    }
}

// 解析环境变量
function checkEnv() {
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        config = dotenv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

function createDefaultConfig(){
    const cliConfig = {
        home: userHome
    }
    if(process.env.CLI_HOME){
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    }else{
        cliConfig['cliHome'] = path.join(userHome, constact.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig['cliHome']
}

// 解析debug
function checkInputArgv() {
    let minimist = require('minimist')
    argv = minimist(process.argv.slice(2))
    checkArgs()
}

function checkArgs() {
    if (argv.debug) {
        process.env.LOG_LEVEL = 'verbose'
    } else {
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
}
// 检查用户是否存在主目录
function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('用户主目录不存在'))
    }
}

// 权限降级
function checkRoot() {
    let rootCheck = require('root-check')
    rootCheck()
}
// 检查Node的版本
function checkNodeVersion() {
    // 当前node的版本
    let currentNodeVersion = process.version
    // 最低node版本
    let lowerNodeVersion = constact.LOWEST_NODE_VERSION
    if (!semver.gte(currentNodeVersion, lowerNodeVersion)) {
        throw new Error(colors.red(`starfish-cli 需安装 v${lowerNodeVersion} 以上版本的node.js`))
    }
}

// 检查库的版本
function checkPkgVersion() {
    log.success('test', pkg.version)
}

module.exports = core;
