const ipc = require('node-ipc'),
    Spawner = require('./spawnPianobar'),
    logger = require('simple-node-logger').createSimpleLogger('debug.log'),
    History = require('./History'),
    io = require('socket.io'),
    log = logger.trace,
    currentTime = new History(20),
    current = new History(120),
    pastSongs = new History(50, { key: 'coverArt' }),
    isPlaying = new History(1),
    spawnInstance = new Spawner(true, {
        onExit: function (exitCode, signal) {
            if (signal === 'SIGINT')
                process.kill(process.pid, 'SIGINT');
            process.exit()
        },
        onEnd: function () {
            //this one is not foing to work
            ipc.server.stop()
        },
        onData: function (data) {
            //this one is not foing to work
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
            }
        }
    }),
    http = require('http'),
    port = 8081,
    url = require('url'),
    fs = require('fs'),
    path = require('path'),
    server = http.createServer(function (req, res) {
        console.log(`${req.method} ${req.url}`);

        // parse URL
        const parsedUrl = url.parse(req.url);
        // extract URL path
        let pathname = `./html/dist/${parsedUrl.pathname}`;
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // maps file extention to MIME typere
        const map = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword'
        }

        fs.exists(pathname, function (exist) {
            if (!exist) {
                // if the file is not found, return 404
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
                return;
            }

            // if is a directory search for index file matching the extention
            if (fs.statSync(pathname).isDirectory())
                pathname += '/index' + ext;

            // read file from file system
            fs.readFile(pathname, function (err, data) {
                if (err) {
                    res.statusCode = 500;
                    res.end(`Error getting the file: ${err}.`);
                } else {
                    // if the file is found, set Content-type and send data
                    res.setHeader('Content-type', map[ext] || 'text/plain');
                    res.end(data);
                }
            });
        });


    })
server.listen(port)

const socket = io.listen(server);

// Add a connect listener
socket.on('connection', function (client) {
    const timeInterval = setInterval(function () {
        client.volatile.emit('currentTime', currentTime.getNewest(), isPlaying.getNewest());
    }, 1000)
    client.on('getCurrentTime', (howMany) => {
        log('got a request for current time')
        client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
    })
    client.on('getCurrentStatus', (howMany) => {
        log('got a request for current status')
        client.emit('getCurrentStatus', current.getNewest(parseInt(howMany)), isPlaying.getNewest())
    })
    client.on('getPastSongs', (howMany) => {
        log('got a request for past Songs')
        if (howMany) {
            client.emit('getPastSongs', pastSongs.getNewest(parseInt(howMany)))
        } else {
            client.emit('getPastSongs', pastSongs.getAll())
        }

    })
    client.on('getIsPlaying', (clientStatus, clientTime) => {
        log('got a request to see if is playing')
        client.emit('getIsPlaying', isPlaying.getNewest())
    })
    client.on('play', (clientStatus, clientTime) => {
        log('got a request to play')
        //client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
        if (isPlaying.getNewest() === false) {
            spawnInstance.writeCommand("play")
        } else {
            client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
        }
        currentTime.clear()
        isPlaying.push(true)

    })
    client.on('pause', (clientStatus, clientTime) => {
        log('got a request to pause')
        //client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
        if (isPlaying.getNewest() === true) {
            spawnInstance.writeCommand("pause")
        } else {
            //client is out of sync send them an update
            client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
        }
        isPlaying.push(false)
    })
    client.on('likeSong', (clientStatus, clientTime) => {
        log('got a request to like')
        //make sure to like the right song
        if (clientStatus && clientStatus.title === current.getNewest().title) {
            spawnInstance.writeCommand("likeSong")
        } else {
            //client is out of sync send them an update
            client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
        }

    })
    client.on('dislikeSong', (clientStatus, clientTime) => {
        log('got a request to dislike')
        //make sure to dislike the right song
        if (clientStatus && clientStatus.title === current.getNewest().title) {
            spawnInstance.writeCommand("dislikeSong")
        } else {
            //client is out of sync send them an update
            client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
        }
        isPlaying.push(true)
    })

    client.on('nextSong', (clientStatus, clientTime) => {
        log('got a request to skip', clientStatus && clientStatus.title, "current song is", current.getNewest().title)
        //make sure to skip the correct song
        if (clientStatus && clientStatus.title === current.getNewest().title) {
            spawnInstance.writeCommand("nextSong")
            isPlaying.push(true)
        } else {
            //client is out of sync send them an update
            client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
        }

    })
    client.on('selectStation', (stationID) => {
        logger.info('got a request to change station to ' + stationID)

        spawnInstance.writeCommand("selectStation")
        spawnInstance.writeCommand(stationID)
        isPlaying.push(true)
    })
    client.on('shuffle', () => {
        log('got a request to change station to shuffle')

        spawnInstance.writeCommand("shuffle")
        isPlaying.push(true)
    })

    const status = current.onpush((state, size) => {
            client.emit('status', JSON.stringify(state))
            client.emit('allStatus', JSON.stringify(current.store))
        }),
        isPlayingHandler = isPlaying.onpush((state) => {
            console.log(state ? 'is playing' : 'is not playing')
            client.emit('isPlaying', state)
        })

    client.on('disconnect', function () {
        clearInterval(timeInterval)
        current.unpush(status)
        isPlaying.unpush(isPlayingHandler)
        console.log('Client has disconnected');
    });
});

currentTime.push({ now: null, ofTotal: null })
isPlaying.push(true)

ipc.config.id = 'pianobar-server';
ipc.config.retry = 1500;
ipc.config.silent = true;
const splitter = stdin => stdin.split("\n").map(str => str.split("=")).reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
    }, {}),
    commands = ['userlogin', 'usergetstations', 'stationfetchplaylist', 'songstart', 'songfinish', 'defaultCommand']

ipc.serve(
    function () {
        ipc.server.on(
            'connect',
            function (socket) {
                //console.log('client connected')
            }
        )

        ipc.server.on(
            'data',
            function (data, socket) {
                //console.log('got a message', data)
            }
        )

        ipc.server.on(
            'cli',
            function ([command, stdin], socket) {
                //log('command:', command)
                if (commands.includes(command)) {
                    const status = splitter(stdin)
                    current.push(status)
                    pastSongs.push(status)
                    //log(status)
                } else {
                    console.log(command, "called with nothing to handle it")
                    //commands.defaultCommand(stdin)
                }
            }
        )

        ipc.server.on(
            'getCurrentTime',
            function (command, socket) {
                log('got a request for current time')

                ipc.server.emit(socket, 'getCurrentTime', currentTime.getNewest())
            }
        )

        ipc.server.on(
            'getStatus',
            function (command, socket) {
                log('got a request for current status')

                ipc.server.emit(socket, 'getStatus', current.getNewest())
            }
        )

        ipc.server.on(
            'getAllStatus',
            function (command, socket) {
                log('got a request for current status')

                ipc.server.emit(socket, 'getAllStatus', current.getAll())
            }
        )
    }
)
ipc.server.start()