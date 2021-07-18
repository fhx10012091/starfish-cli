'use strict';
const inquirer = require('inquirer')
const log = require('@starfish-cli/log')
const Command = require('@starfish-cli/command')
const fs = require('fs')
const fse = require('fs-extra')
const localPath = process.cwd()
const semver = require('semver')
const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
class initCommand extends Command {
    constructor(argv) {
        super(argv)
    }
    init() {
        this.projectName = this._argv[0]
        this.force = this._argv[1].force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec() {
        try {
            // 1、 准备阶段
            const projectInfo = await this.prepare()
            log.verbose('projectInfo', projectInfo)
            this.downloadTemplate()
            // 2、 下载模板
            // 3、 安装模板
        } catch (e) {
            log.error(e.message)
        }
    }
    async prepare() {
        // 判断目录是否为空
        // 是否启动强制更新
        if (!this.isCwdEmpty()) {
            let ifContinue
            if (!this.force) {
                // 询问是否继续创建
                ifContinue = (await inquirer.prompt([{
                    type: 'confirm',
                    name: 'ifContinue',
                    message: '当前文件夹不为空，是否继续创建项目？'
                }])).ifContinue
                if (!ifContinue) return;
            }
            if (ifContinue || this.force) {
                // 给用户二次确认
                const { confirmDelete } = await inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否清空当前目录下的文件'
                })
                if (confirmDelete) {
                    // 启动强制更新
                    // 清空当前目录
                    fse.emptyDirSync(localPath)
                }
            }

        }
        return this.getProjectInfo()
    }
    async getProjectInfo() {
        let projectInfo = {}
        // 选择创建项目或组件
        // const type = ''
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [
                {
                    name: '项目',
                    value: TYPE_PROJECT
                },
                {
                    name: '组件',
                    value: TYPE_COMPONENT
                }
            ]
        })
        log.verbose('type', type)
        if (type === TYPE_PROJECT) {
            // 获取项目的基本信息
            const project = await inquirer.prompt([{
                type: 'input',
                name: 'projectName',
                message: '请输入项目名称',
                default: '',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!/^[a-zA-Z]+([_][a-zA-Z][a-zA-Z0-9]*|[-][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                            done('请输入合法的项目名称')
                            return
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    return v
                }
            }, {
                type: 'input',
                name: 'projectVersition',
                message: '请输入版本号',
                default: '',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!semver.valid(v)) {
                            done('请输入合法的版本号')
                            return
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    if (!!semver.valid(v)) {
                        return semver.valid(v)
                    } else {
                        return v
                    }
                }
            }])
            projectInfo = {
                type,
                ...project
            }
        } else {

        }

        return projectInfo
    }
    downloadTemplate(){

    }
    isCwdEmpty() {
        let fileList = fs.readdirSync(localPath)
        // 文件过滤逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        return !fileList || fileList.length <= 0
    }
}

function init(argv) {
    return new initCommand(argv)
}


module.exports = init;
module.exports.initCommand = initCommand

