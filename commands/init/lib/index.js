'use strict';
const log = require('@starfish-cli/log')
const Command = require('@starfish-cli/command')

class initCommand extends Command {
    constructor(argv){
        super(argv)
    }
    init(){
        this.projectName = this._argv[0]
        this.force = this._argv[1].force
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    exec(){
        console.log('exec')
    }
}

function init(argv){
    return new initCommand(argv)
}


module.exports = init;
module.exports.initCommand = initCommand

