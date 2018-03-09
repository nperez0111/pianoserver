const globals = require('./globals'),
    { ipc, Spawner, logger, History, io, response, log, currentTime, current, pastSongs, isPlaying, http, url, fs, path, ipcResponse, shortcuts, pianobarLog, localtunnel, opn, config, notifier } = globals,
    SpawnImmediately = true,
    spawnInstance = new Spawner(SpawnImmediately, {
        onExit: function (exitCode, signal) {
            if (signal === 'SIGINT')
                process.kill(process.pid, 'SIGINT');
            ipc.server.stop()
            globals.shortcuts.destroy()
            process.exit()
        },
        onEnd: function () {
            //maybe dont stop the server but restart pianobar?
            ipc.server.stop()
            globals.shortcuts.destroy()
        },
        onData: function (data) {
            const getTime = /(\d\d:\d\d).(\d\d:\d\d)/
            if (getTime.test(data)) {
                const [now, ofTotal] = Array.from(data.match(getTime)).slice(1)

                currentTime.push({ now, ofTotal })
                //ipc.server.emit('currentTime',currentTime)
                const lastTimes = currentTime.getNewest(7)
                if (lastTimes.every(({ now }) => now === lastTimes[0].now) && isPlaying.getNewest() === true && lastTimes.length == 7) {
                    isPlaying.push(false)
                }

            } else {
                console.log(data.trim())
                pianobarLog.push(data.trim())
            }
        }
    }),
    express = require('express'),
    app = express(),
    server = http.Server(app),
    socket = io.listen(server),
    subdomain = process.argv[3] || process.argv[2] || 'pandora',
    port = process.argv[2] || globals.port


globals.spawnInstance = spawnInstance
globals.shortcuts = shortcuts({ ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger, response, notifier, config })

if (config.config.get('listenShortcuts')) {
    globals.shortcuts.init()
}

app.use(express.static('client/dist'))
server.listen(port)

// Add a connect listener
socket.on('connection', function (client) {
    const obj = { spawnInstance, isPlaying, current, currentTime, pastSongs, log, logger, pianobarLog, config, shortcuts: globals.shortcuts }
    //needs to be seperate from globals because attachments work per instance of connection

    Object.keys(response).forEach(key => {
        client.on(key, response[key](client, obj))
    })
    response.init(client, obj)()
});

currentTime.push({ now: '00:01', ofTotal: '99:99' })
isPlaying.push(true)

ipc.config.id = 'pianobar-server';
ipc.config.retry = 1500;
ipc.config.silent = true;

ipc.serve(() => {
    const response = ipcResponse(globals)
    Object.keys(response).forEach(key => {
        const responseFunc = response[key]
        ipc.server.on(key, responseFunc)
    })
})
ipc.server.start();

(function tunnel() {

    localtunnel(port, { subdomain }, function (err, tunnel) {
        var store;
        if (err) {
            pianobarLog.unpush(store)
            pianobarLog.push('Restarting Local Tunnel...')
            console.log('Restarting Local Tunnel...', err)
            setTimeout(tunnel, 500)
            return
            //process.exit(2)
        }
        const message = `Your local tunnel URL: ${tunnel.url}`


        console.log(message)
        if (!pianobarLog.getOldest(1).startsWith("Your")) {
            pianobarLog.store.unshift(message)
        }
        store = pianobarLog.onpush((state, length) => {
            if (length === pianobarLog.size) {
                pianobarLog.store.unshift(message)
            }
        })

        if (config.config.get('openTunnelURL')) {
            opn(tunnel.url)
        }
    })
})()