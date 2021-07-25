'use strict';
const inquirer = require('inquirer')
const path = require('path')
const log = require('@starfish-cli/log')
const Command = require('@starfish-cli/command')
const Package = require('@starfish-cli/package')
const { spinnerStart, sleep, spawnAsync } = require('@starfish-cli/utils')
const userHome = require('user-home')
const fs = require('fs')
const fse = require('fs-extra')
const localPath = process.cwd()
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate')
const ejs = require('ejs')
const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

const WHITE_COMMAND = ['npm', 'cnpm']
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
            this.projectInfo = projectInfo
            // 2、 下载模板
            await this.downloadTemplate()
            // 3、 安装模板
            await this.installTemplate()
        } catch (e) {
            log.error(e.message)
        }
    }
    async installTemplate() {
        log.verbose('templateInfo', this.templateInfo)
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                await this.installNormalTemplate()
            } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                await this.installCustomTemplate()
            } else {
                throw new Error('项目模板无法识别！')
            }
        } else {
            throw new Error('项目模板信息不存在！')
        }
    }
    async execCommand(command, err) {
        if (command) {
            const installCmd = command.split(' ')
            const cmd = this.checkCommand(installCmd[0])
            const args = installCmd.slice(1)
            let installRet = await spawnAsync(cmd, args, {
                stdio: 'inherit',
                cmd: process.cwd()
            })
            if (installRet > 0) {
                throw err
            }
        }
    }
    async ejsRender(options) {
        const dir = process.cwd()
        return new Promise((resolve, reject) => {
            require('glob')('**', {
                cwd: dir,
                ignore: options.ignore,
                nodir: true
            }, (err, files) => {
                if (err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(dir, file)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, this.projectInfo, (err, result) => {
                            console.log(err, result)
                            if (err) {
                                reject1(err)
                            } else {
                                fs.writeFileSync(filePath, result)
                                resolve1(result)
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }
    async installNormalTemplate() {
        // console.log('安装标准模板')
        // 拷贝模板代码至当前目录
        let spinner = spinnerStart('正在加载模板...')
        await sleep(2000)
        try {
            const templatePath = path.resolve(this.templateNpm.cancheFilePath, 'template')
            const targetPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath)
        } catch (e) {
            throw e
        } finally {
            spinner.stop(true)
            log.success('模板安装成功')
        }
        // 模板渲染
        const templateIgnore = this.templateInfo.ignore || []
        const ignore = ['node_modules/**', ...templateIgnore]
        await this.ejsRender({
            ignore
        })
        // 依赖安装
        const { installCommand, startCommand } = this.templateInfo
        await this.execCommand(installCommand, '依赖安装过程中失败!')
        // 启动命令执行
        await this.execCommand(startCommand, '执行过程中失败!')
    }
    checkCommand(cmd) {
        if (WHITE_COMMAND.indexOf(cmd) > -1) {
            return cmd
        }
        return null
    }
    async installCustomTemplate() {
         let rootFile = this.templateNpm.getRootFilePath()
         if(fs.existsSync(rootFile)){
            // rootFile = 'D:/starfish-cli/starfish-cli-template/starfish-cli-template-custom-vue2/index.js';
             log.notice('开始执行自定义模板');
             const templatePath = path.resolve(this.templateNpm.cancheFilePath, 'template')
             const options = {
                 ...this.templateInfo,
                 sourcePath: templatePath,
                 ...this.projectInfo,
                targetPath: process.cwd()
             };
             const code = `require('${rootFile}')(${JSON.stringify(options)})`;
             log.verbose('code', code)
             await spawnAsync('node', ['-e', code], {
                 stdio: 'inherit',
                 cwd: process.cwd()
             });
             log.success('自定义模板安装成功')
         }
    }
    async prepare() {
        // 判断项目目标是否存在
        // console.log(getProjectTemplate)
        const template = await getProjectTemplate()
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在')
        }
        this.template = template
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
        function isValidName(v) {
            return /^[a-zA-Z]+([_][a-zA-Z][a-zA-Z0-9]*|[-][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }
        let projectInfo = {}
        let isProjectNameVaild = false
        if (isValidName(this.projectName) && !!this.projectName) {
            isProjectNameVaild = true
            projectInfo.projectName = this.projectName
        }
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
        this.template = this.template.filter(template => template.tag.includes(type))
         const title = type ===TYPE_PROJECT?'项目':'组件'
         const projectNamePrompt = {
                type: 'input',
                name: 'projectName',
                message: `请输入合法${title}名称`,
                default: 'starfish_projectname',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!isValidName(v)) {
                            done(`请输入合法${title}名称`)
                            return
                        }
                        done(null, true)
                    })
                },
                filter: (v) => {
                    return v
                }
            }
            const projectPrompt = []
            if (!isProjectNameVaild) {
                projectPrompt.push(projectNamePrompt)
            }
            projectPrompt.push({
                type: 'input',
                name: 'projectVersion',
                message: '请输入版本号',
                default: '1.0.0',
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
            }, {
                type: 'list',
                name: 'projectTemplate',
                message: `请选择${type}模板`,
                choices: this.createTemplateChoice()
            })
        if (type === TYPE_PROJECT) {
            // 获取项目的基本信息
            const project = await inquirer.prompt(projectPrompt)
            projectInfo = Object.assign({}, projectInfo, {
                type,
                ...project
            })
        } else {
            const descriptPrompt = {
                type: 'input',
                name: 'componentDescription',
                message: '请输入组件描述信息',
                default: '',
                validate: function (v) {
                    const done = this.async()
                    setTimeout(() => {
                        if (!v) {
                            done('请输入组件描述信息')
                            return
                        }
                        done(null, true)
                    })
                }
            }
            projectPrompt.push(descriptPrompt)
            // 获取组件基本信息
            const component = await inquirer.prompt(projectPrompt)
            projectInfo = Object.assign({}, projectInfo, {
                type,
                ...component
            })
        }
        if (projectInfo.projectName) {
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
        }
        if(projectInfo.projectVersion){
            projectInfo.version = projectInfo.projectVersion
        }
        if(projectInfo.componentDescription){
            projectInfo.description = projectInfo.componentDescription
        }
        return projectInfo
    }
    createTemplateChoice() {
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name
        }))
    }
    async downloadTemplate() {
        // console.log(this.projectInfo, this.template)
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.template.find(item => {
            return item.npmName === projectTemplate
        })
        this.templateInfo = templateInfo
        // console.log(userHome)
        // console.log('templateInfo', templateInfo)
        const targetPath = path.resolve(userHome, '.starfish-cli', 'template')
        const storeDir = path.resolve(userHome, '.starfish-cli', 'template', 'node_modules')
        const { npmName, version } = templateInfo
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        // log.verbose('templateNpm', templateNpm)
        if (!await templateNpm.exists()) {
            const spinner = spinnerStart('正在加载模板...')
            await sleep(2000)
            try {
                await templateNpm.install()
            } catch (e) {
                throw e
            } finally {
                spinner.stop(true)
                if (await templateNpm.exists()) {
                    log.success('下载模板成功！')
                    this.templateNpm = templateNpm
                }
            }
        } else {
            const spinner = spinnerStart('正在更新模板...')
            await sleep(2000)
            try {
                await templateNpm.update(true)
            } catch (e) {
                throw e
            } finally {
                spinner.stop(true)
                if (await templateNpm.exists()) {
                    log.success('更新模板成功！')
                    this.templateNpm = templateNpm
                }
            }
        }
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

