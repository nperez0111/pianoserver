const globals = require('./globals'),
    { ipc, Spawner, logger, History, io, response, log, currentTime, current, pastSongs, isPlaying, http, port, url, fs, path, ipcResponse } = globals,
    SpawnImmediately = true,
    spawnInstance = new Spawner(SpawnImmediately, {
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
    const obj = { spawnInstance, isPlaying, current, currentTime, pastSongs, log, logger }
    //needs to be seperate from globals because attachments work per instance of connection

    Object.keys(response).forEach(key => {
        client.on(key, response[key](client, obj))
    })
    response.init(client, obj)()
});

currentTime.push({ now: null, ofTotal: null })
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
ipc.server.start()