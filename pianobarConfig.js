const homedir = require('homedir')(),
    path = require('path'),
    fs = require('fs'),
    configFileLoc = path.resolve(homedir, ".config/pianobar/config")

class pianobarConfig {

    constructor() {
        this.lines = []
        const instance = this
        this.getLinesFromFile().then(file => {
            this.lines = file.split('\n')
        })
    }
    getLinesFromFile() {
        return new Promise((resolve, reject) => {
            fs.readFile(configFileLoc, 'utf8', (err, data) => {
                if (err) reject(err)
                resolve(data)
            })
        })
    }
    writeLinesToFile() {
        return new Promise((resolve, reject) => {
            fs.writeFile(configFileLoc, this.lines.join('\n'), 'utf8', (err) => {
                if (err) reject(err)
                resolve()
            })
        })

    }
    getAll() {
        return this.lines.filter(line => line.length > 0).reduce((obj, line) => {
            const [key, value] = line.split(" = ")
            obj[key] = value
            return obj
        }, {})
    }
    get(key, getIndex = false) {
        const line = this.lines.find(line => line.startsWith(key.toLowerCase()))
        if (!line)
            return null
        return getIndex ? this.lines.indexOf(line) : line.split(" = ")[1]
    }
    set(key, value) {
        const index = this.get(key, true)
        this.lines[index] = `${key} = ${value}`
        return this.writeLinesToFile()
    }
}
if (!module.parent) {
    const p = new pianobarConfig()
    setTimeout(() => {
        console.log(p.getAll(), p.get('user'), p.get('password'))
    }, 200)
}
module.exports = pianobarConfig