const pm2 = require('pm2'),
    path = require('path'),
    dotProp = require('dot-prop'),
    serverName = 'pianoserver',
    defaultPort = 8081,
    defaultSubdomain = 'pianoserver'

function startServer(subdomain, port) {
    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) {
                reject('An error occured attempting to start the server, please try again...')
                return process.exit(2)
            }

            pm2.start({
                name: serverName,
                script: path.resolve(__dirname, 'index.js'), // Script to be run
                args: [port || defaultPort, subdomain || defaultSubdomain],
            }, function (err, apps) {
                pm2.disconnect(); // Disconnects from PM2
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            })
        })
    })

}

function restartServer() {
    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) {
                reject("An error occured attempting to restart the server, please try again...")
                return process.exit(2)
            }
            pm2.gracefulReload(serverName)
            pm2.disconnect()
            resolve(true)
        })
    })

}

function quitServer() {
    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) {
                reject("An error occured attempting to quit the server, please try again...")
                process.exit(2)
            }
            pm2.stop(serverName)
            setTimeout(() => {
                pm2.disconnect.bind(pm2)
                resolve()
            }, 300)
        })
    })

}

function checkIfRunning(cb) {
    const { notRunning = () => false, running = () => true } = cb

    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) {
                notRunning()
                reject(err)
                return
            }
            pm2.describe(serverName, (err, descriptions) => {
                pm2.disconnect()
                const stoppedWhen = ['stopped', 'errored', 'stopping']
                if (err || descriptions.length === 0 || stoppedWhen.includes(dotProp.get(descriptions, '0.pm2_env.status'))) {
                    notRunning()
                    reject(false)
                    return
                }
                running()
                resolve(true)
            })
        })
    })
}

module.exports = {
    quitServer: quitServer,
    restartServer: restartServer,
    startServer: startServer,
    checkIfRunning: checkIfRunning
}