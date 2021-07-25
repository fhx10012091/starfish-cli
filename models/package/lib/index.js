'use strict';
const path = require('path')
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fse = require('fs-extra')
const { isObject } = require('@starfish-cli/utils')
const { getDefaultRegistry, getLatestNpmVersion, getNpmSemverVersions } = require('@starfish-cli/get-npm-info')
const pkgDir = require('pkg-dir').sync
const formatPath = require('@starfish-cli/format-path')
class Package {
    constructor(options) {
        if (!options) {
            return new Error('Package类的参数不能为空')
        }
        if (!isObject(options)) {
            return new Error('Options参数必须为对象')
        }
        // package 路径
        this.targetPath = options.targetPath
        // 缓存路径
        this.storeDir = options.storeDir
        // package 的存储路径
        // this.storePath = options.storePath
        // package 的name
        this.packageName = options.packageName
        // package 的version
        this.packageVersion = options.packageVersion
        // 缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }
    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            fse.mkdirpSync(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getLatestNpmVersion(this.packageName)
        }
    }
    get cancheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }
    getLatestCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }
    // 判断当前package是否存在
    async exists() {
        if (this.storeDir) {
            await this.prepare()
            // console.log(this.cancheFilePath)
            return pathExists(this.cancheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }
    // 安装package
    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [
                { name: this.packageName, version: this.packageVersion }
            ]
        })
    }
    // 更新package
    async update() {
        await this.prepare()
        //  获取最新的npm模块版本号
        const latestPackageVersion = await getLatestNpmVersion(this.packageName)
        console.log('最新的', latestPackageVersion)
        // 查询最新的版本号对应的路径是否存在
        const latestFilePath = this.getLatestCacheFilePath(latestPackageVersion)
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [
                    { name: this.packageName, version: latestPackageVersion }
                ]
            })
            this.packageVersion = latestPackageVersion
        } else {
            this.packageVersion = latestPackageVersion
            console.log('已经是最新的版本了！')
        }
    }
    // 获取入口文件的路径
    getRootFilePath() {
        function _getRootPath(paths) {
            // 获取package.json所在的路径
            const dir = pkgDir(paths)
            if (dir) {
                // 获取package.json
                const pkgFile = require(path.resolve(dir, 'package.json'))
                // 寻找main/lib
                if (pkgFile && pkgFile.main) {
                    return formatPath(path.resolve(dir, pkgFile.main))
                }
                // 路径的兼容（macOS/windows）
            }
            return null
        }
        if (this.storeDir) {
            return _getRootPath(this.cancheFilePath)
        } else {
            return _getRootPath(this.targetPath)
        }

    }
}
module.exports = Package;
