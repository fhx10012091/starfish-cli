'use strict';
let urlJoin = require('url-join')
let axios = require('axios')
let semver = require('semver')
function getNpmInfo(npmName, register) {
    if(!npmName){
        return null
    }
    let registers = register || getDefaultRegistry()
    let npmUrl = urlJoin(registers, npmName)
    return axios.get(npmUrl).then(res => {
        if(res.status === 200){
            return res.data
        }
        return null
    }).catch(err => {
        return Promise.reject(err)
    })
}

function getDefaultRegistry(isOriginal = false){
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}
// 获取所有版本号
async function getRegistryVersion(npmName, register){
    let data = await getNpmInfo(npmName, register)
    return Object.keys(data.versions)
}
// 获取符合条件的版本号
function getSemverVersions(baseVersion, versions){
    return versions.filter(version => semver.satisfies(version, `^${baseVersion}`)).sort((a, b) => semver.gt(b, a))
}
async function getNpmSemverVersions(npmName, baseVersion, register){
    let versions = await getRegistryVersion(npmName, register)
    let newVersions = getSemverVersions(baseVersion, versions)
    if(newVersions && newVersions.length > 0){
        return newVersions[0]
    }
    return null
}
async function getLatestNpmVersion(npmName, registry){
    let versions = await getRegistryVersion(npmName, registry)
    if(versions){
        return versions = versions.sort((a, b) => semver.gt(a, b))[0]
    }
    return null
}
module.exports = {
    getNpmSemverVersions,
    getDefaultRegistry,
    getLatestNpmVersion
};
