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
    program = require('commander'),
    chalk = require('chalk'),
    path = require('path'),
    getStdin = require('get-stdin'),
    serverCommands = require('./serverCommands'),
    startServer = serverCommands.startServer,
    quitServer = serverCommands.quitServer,
    restartServer = serverCommands.restartServer,
    checkIfRunning = serverCommands.checkIfRunning,
    ipcCommands = {
        play: 'Play song',
        pause: 'Pause song',
        likeSong: 'Like the current song',
        dislikeSong: 'Dislike the current song',
        nextSong: 'Play next song',
        shuffle: 'Shuffle all stations'
    }

function connectToConsole() {
    console.log(chalk.green(`PRESSING "q" quits the server and restarts it, CTRL-C quits viewer while still playing in background, ESC quits the server\n`))
    const ipc = require('node-ipc'),
        serverName = 'pianobar-server',
        stdin = process.stdin,
        state = {
            hasNotRun: true,
            isDisconnected: true
        }

    ipc.config.id = 'pianobar-console'
    ipc.config.retry = 50
    ipc.config.silent = true

    //console.log(`Welcome to Pianobar!\n`)

    ipc.connectTo(serverName, () => {
        ipc.of[serverName].on('connect', () => {
            if (state.hasNotRun) {
                ipc.of[serverName].emit('getPastLines', 200)
                state.hasNotRun = false
            } else {
                console.log(`Reconnected to Server`)
            }
            state.isDisconnected = false
        })
        ipc.of[serverName].on('disconnect', () => {
            if (!state.isDisconnected) {
                console.log(`Lost Connection to Server...`)
            }
            state.isDisconnected = true
            setTimeout(() => {
                if (state.isDisconnected) {
                    process.exit()
                }
            }, 2000)
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
                // CTRL-C ( end of text )
                process.exit()
                return
            }
            if (key === '\u001B') {
                // ESC
                quitServer().then(() => {
                    console.log('\nServer has been stopped.')
                    process.exit()
                })
                return
            }

            //send single char and flush stdin
            ipc.of[serverName].emit('sendLine', key)
            // write the key to stdout all normal like
            process.stdout.write(key)
        })

    })

}

function sendStdin(currentCommand) {
    const ipc = require('node-ipc'),
        serverName = 'pianobar-server'
    ipc.config.id = 'pianobar-stdin'
    ipc.config.retry = 30
    ipc.config.maxRetries = 200
    ipc.config.silent = true

    getStdin().then(stdin => {

        ipc.connectTo(serverName, () => {
            ipc.of[serverName].on('connect', () => {

                ipc.of[serverName].emit('cli', [currentCommand, stdin]);

                ipc.disconnect(serverName)
            });
        })

    })
}

function tryServerCommand(command, args) {
    const Connector = require('./lib/Connector')
    if (command in ipcCommands) {
        const connection = new Connector()
        return connection.on(command, args).then(() => {
            //console.log(`Ran: ${command}`)
            process.exit(0)
        }).catch(err => {
            console.error(err)
        })
    }

}

Object.keys(ipcCommands).forEach(command => {
    program.command(command).description(ipcCommands[command]).action(function () {
        tryServerCommand(command)
    })
})

program.command('selectStation <station>').description('Select the station to play (Either # of station or station name)').action(function (station) {
    tryServerCommand('selectStation', station)
})
program.command('quit').description('Stops the PM2 Process').action(() => {
    quitServer().then(() => { process.exit() })
})
program.command('restart').description('Reloads the PM2 Instance').action(() => {
    restartServer().then(() => { process.exit() })
})
program.command('install').description('Installs pianobar, Regenerates the Web UI').action(() => {
    const install = require('./install')
    install().catch(() => console.error("Something must've gone wrong")).then(() => process.exit())
})
program.command('start [port] [subdomain]').description('Starts the server for both pianobar console and the web app. Allows you to specify the subdomain you would like to use. Otherwise will try to use pandora or if unavailable will try to use a random one.').action((port, subdomain) => {
    if (port !== Number(port).toString()) {
        subdomain = port
        port = defaultPort
    }
    //console.log(subdomain, Number(port))
    startServer(subdomain, port)
})
program.description('Starts the server for both pianobar console and the web app. If the server is running, lets you interact with the console interface of pianobar.')
program.arguments('[pianobarCommand]')
    .action(function (pianobarCommand) {
        sendStdin(pianobarCommand)
    })

program.version('0.0.1').parse(process.argv)

const NO_COMMAND_SPECIFIED = program.args.length === 0

if (NO_COMMAND_SPECIFIED) {
    checkIfRunning({}).catch(startServer).then(() => {
        setTimeout(connectToConsole, 1000)
    })
}