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
    serverName = 'Pianobar Server',
    port = 8081,
    settings = {
        openOnStart: true
    },
    ipcCommands = ['play', 'pause', 'likeSong', 'nextSong', 'dislikeSong', 'shuffle']


function startServer() {
    localtunnel(port, { subdomain: 'pandora' }, function (err, tunnel) {
        if (err) {
            console.error(err)
            process.exit(2)
        }


        console.log(`Your local tunnel URL: \n${tunnel.url}`)

        if (settings.openOnStart) {
            opn(tunnel.url)
        }
    })
    pm2.connect(function (err) {
        if (err) {
            console.error(err)
            process.exit(2)
        }

        pm2.start({
            name: serverName,
            script: 'ecosystem.config.js', // Script to be run
        }, function (err, apps) {
            pm2.disconnect(); // Disconnects from PM2
            if (err) throw err
        })
    })
}

function restartServer() {
    pm2.connect(function (err) {
        if (err) {
            console.error(err)
            process.exit(2)
        }
        pm2.gracefulReload(serverName)
    })
}

function quitServer() {
    pm2.connect(function (err) {
        if (err) {
            console.error(err)
            process.exit(2)
        }
        pm2.stop(serverName)
    })
}

function tryServerCommand(command, args) {

    if (ipcCommands.includes(command)) {
        const connection = new Connector()
        connection.on(command, args).then(() => {
            //console.log(`Ran: ${command}`)
            process.exit(0)
        }).catch(err => {
            console.error(err)
        })
    }

}

ipcCommands.forEach(command => {
    program.command(command).action(function () {
        tryServerCommand(command)
    })
})

program.command('selectStation <station>').action(function (station) {
    tryServerCommand('selectStation', station)
})
program.command('quit').description('Stops the PM2 Process').action(() => {
    quitServer()
})
program.command('restart').description('Reloads the PM2 Instance').action(() => {
    restartServer()
})
program.command('start').description('Starts the server for both pianobar console and the web app').action(() => {
    startServer()
})
program.command('*').description('Starts the server or if the server is running lets you use the console interface of pianobar').action(() => {
    startServer()
})

program.version('0.0.1').parse(process.argv)