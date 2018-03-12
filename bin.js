#!/usr/bin/env node

// pianobar
// should start server and serve website to localhost and hopefully out on lan
// starts a local tunnel instance, a pm2 instance that reloads using pm2 api, runs a script to connect to server and see its output as well as send messages back
// pianobar ${command (i.e play or pause)}
// should run command that the server would do
// pianobar restart
// restarts the server via pm2
// pianobar quit
// quits server and pianobar
// pianobar settings
// Sets any settings that are available to change


// pianobar (while server instance exists) -- Dream --
// should connect to server ui and display that and let commands go through as well

const pm2 = require('pm2'),
    opn = require('opn'),
    localtunnel = require('localtunnel'),
    Connector = require('./lib/Connector'),
    program = require('commander'),
    chalk = require('chalk'),
    path = require('path'),
    dotProp = require('dot-prop'),
    serverName = 'pianoserver',
    defaultPort = 8081,
    defaultSubdomain = 'pianoserver',
    ipcCommands = { play: 'Play song', pause: 'Pause song', likeSong: 'Like the current song', dislikeSong: 'Dislike the current song', nextSong: 'Play next song', shuffle: 'Shuffle all stations' }


function startServer(subdomain, port) {
    pm2.connect(function(err) {
        if (err) {
            console.error('An error occured attempting to start the server, please try again...')
            process.exit(2)
        }

        pm2.start({
            name: serverName,
            script: path.resolve(__dirname, 'index.js'), // Script to be run
            args: [port || defaultPort, subdomain || defaultSubdomain],
        }, function(err, apps) {
            pm2.disconnect(); // Disconnects from PM2
            if (err) throw err
        })
    })
}

function restartServer() {
    pm2.connect(function(err) {
        if (err) {
            console.error("An error occured attempting to restart the server, please try again...")
            process.exit(2)
        }
        pm2.gracefulReload(serverName)
        pm2.disconnect()
    })
}

function checkIfRunning(cb) {
    pm2.connect(function(err) {
        if (err) {
            cb.notRunning()
            return
        }
        pm2.describe(serverName, (err, descriptions) => {
            pm2.disconnect()
            const stoppedWhen = ['stopped', 'errored', 'stopping']
            if (err || descriptions.length === 0 || stoppedWhen.includes(dotProp.get(descriptions, '0.pm2_env.status'))) {
                cb.notRunning()
                return
            }
            cb.running()
        })
    })
}

function connectToConsole() {
    console.log(chalk.green(`PRESSING "q" quits the server and restarts it, CTRL-C quits viewer while still playing in background, ESC quits the server\n`))
    const ipc = require('node-ipc'),
        serverName = 'pianobar-server',
        stdin = process.stdin

    ipc.config.id = 'pianobar-console'
    ipc.config.retry = 1500
    ipc.config.silent = true
    let hasRun = false

    //console.log(`Welcome to Pianobar!\n`)

    ipc.connectTo(serverName, () => {
        ipc.of[serverName].on('connect', () => {

            if (hasRun === false) {
                ipc.of[serverName].emit('getPastLines', 200)
                hasRun = true
                return
            }

            console.log(`Reconnected to Server`)

        })
        ipc.of[serverName].on('killProcess', () => {
            process.exit()
        })
        ipc.of[serverName].on('getLine', line => {
            console.log(line)
        })
        ipc.of[serverName].on('getPastLines', lines => {
            lines.forEach(line => {
                console.log(line)
            })
        })

        // without this, we would only get streams once enter is pressed
        if (stdin.setRawMode) {
            stdin.setRawMode(true);
        }

        // resume stdin in the parent process (node app won't quit all by itself
        // unless an error or process.exit() happens)
        stdin.resume();

        // i don't want binary, do you?
        stdin.setEncoding('utf8');

        // on any data into stdin
        stdin.on('data', key => {

            if (key === '\u0003') {
                // ctrl-c ( end of text )
                // ESC
                process.exit()
            }
            if (key === '\u001B') {
                quitServer()
                console.log('Server has been stopped.')
                process.exit()
            }

            //send single char and flush stdin
            ipc.of[serverName].emit('sendLine', key)
            // write the key to stdout all normal like
            process.stdout.write(key)
        })

    })

}

function quitServer() {
    pm2.connect(function(err) {
        if (err) {
            console.error("An error occured attempting to quit the server, please try again...")
            process.exit(2)
        }
        pm2.stop(serverName)
        setTimeout(pm2.disconnect.bind(pm2), 300)
    })
}

function tryServerCommand(command, args) {

    if (command in ipcCommands) {
        const connection = new Connector()
        connection.on(command, args).then(() => {
            //console.log(`Ran: ${command}`)
            process.exit(0)
        }).catch(err => {
            console.error(err)
        })
    }

}

Object.keys(ipcCommands).forEach(command => {
    program.command(command).description(ipcCommands[command]).action(function() {
        tryServerCommand(command)
    })
})

program.command('selectStation <station>').description('Select the station to play (Either # of station or station name)').action(function(station) {
    tryServerCommand('selectStation', station)
})
program.command('quit').description('Stops the PM2 Process').action(() => {
    quitServer()
})
program.command('restart').description('Reloads the PM2 Instance').action(() => {
    restartServer()
})
program.command('start [port] [subdomain]').description('Starts the server for both pianobar console and the web app. Allows you to specify the subdomain you would like to use. Otherwise will try to use pandora or if unavailable will try to use a random one.').action((port, subdomain) => {
    if (port !== Number(port).toString()) {
        subdomain = port
        port = defaultPort
    }
    //console.log(subdomain, Number(port))
    startServer(subdomain, port)
})
program.description('Starts the server for both pianobar console and the web app. If the server is running, lets you interact with the console interface of pianobar.').action(() => {
    startServer()
})

program.version('0.0.1').parse(process.argv)

const NO_COMMAND_SPECIFIED = program.args.length === 0

if (NO_COMMAND_SPECIFIED) {
    checkIfRunning({
        running() {
            connectToConsole()
        },
        notRunning() {
            startServer()
            connectToConsole()
        }
    })
}