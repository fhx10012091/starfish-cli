'use strict';
const pkg = require('../package.json')
const log = require('@starfish-cli/log')
const init = require('@starfish-cli/init')
const exec = require('@starfish-cli/exec')
const constact = require('./const')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists')
const path = require('path')
const commander = require('commander')
const program = new commander.Command()
let argv, config
// 脚手架的启动过程
function core() {
    // TODO
    try {
        prepare()
        registerCommand()
    } catch (e) {
        log.error(e.message)
    }
}

// 脚手架命令注册过程
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试着模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

    // 初始化命令行
    program
        .command('init [projectName]')
        .description('初始化项目')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec)

    
    program.on('option:debug', function () {
        let opts = program.opts()
        if (opts.debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
    })
    program.on('option:targetPath', function(){
        // 包与包之间进行解耦
        // 使用环境变量
        let targetPath = program.opts().targetPath
        if(targetPath){
            process.env.CLI_TARGET_PATH = targetPath
        }
    })
    program.on('command:*', function(obj){
        let availableCommand = program.commands.map(cmd => cmd.name())
        console.log(colors.red(`未知的命令:${obj[0]}`))
        if(availableCommand.length > 0){
            console.log(colors.green(`可用命令:${availableCommand.join(',')}`))
        }
    })
    if(process.argv.length < 3){
        program.outputHelp()
    }
    // if(program.args && program.)
    program.parse(process.argv)
}
// 准备阶段
function prepare(){
    // checkPkgVersion()
    // checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    checkNpmInfo()
}

async function checkNpmInfo() {
    // 获取包名和包版本号
    let npmName = pkg.name
    let currentVersion = pkg.version

    let { getNpmSemverVersions } = require('@starfish-cli/get-npm-info')
    let newVersion = await getNpmSemverVersions(npmName, currentVersion)
    if (semver.gt(newVersion, currentVersion)) {
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
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constact.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig['cliHome']
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


// 检查库的版本
// function checkPkgVersion() {
//     log.success('test', pkg.version)
// }

module.exports = core;
