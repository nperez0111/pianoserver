const homedir = require('homedir')(),
    path = require('path'),
    fs = require('fs'),
    execa = require('execa'),
    configLoc = path.resolve(homedir, ".config/pianobar"),
    configFileLoc = path.resolve(configLoc, "config"),
    passLoc = path.resolve(configLoc, "pass.enc")

class pianobarConfig {

    constructor({ readLines = true }) {
        this.lines = []
        if (readLines) {
            const instance = this
            this.getLinesFromFile().then(file => {
                this.lines = file.split('\n')
            })
        }
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
                resolve(true)
            })
        })

    }
    getAll() {
        return this.lines.filter(line => line.length > 0).reduce((obj, line) => {
            const [key, value] = line.split(" = ")
            if (key !== 'password') {
                obj[key] = value
            }
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
        if (index === null) {
            return Promise.reject(`Unable to find:${key} in config file`)
        }
        this.lines[index] = `${key} = ${value}`
        return this.writeLinesToFile()
    }
    disable(key) {
        const index = this.get(key, true)
        if (index === null) {
            return Promise.reject(`Unable to find:${key} in config file`)
        }
        const isCommented = this.lines[index].startsWith('#')
        if (isCommented) {
            return Promise.resolve(true)
        } else {
            this.lines[index] = `#${this.lines[index]}`
            return this.writeLinesToFile()
        }
    }
    setPassword(password) {
        console.log(passLoc, password)
        return execa('openssl', ['enc', '-aes-256-cbc', '-salt', '-pass', 'pass:pianoserver', '-out', passLoc], { input: password })
    }
}
if (!module.parent) {
    const p = new pianobarConfig()
    setTimeout(() => {
        console.log(p.getAll(), p.get('user'), p.get('password'))
    }, 200)
}
module.exports = pianobarConfig