const logger = require('simple-node-logger').createSimpleLogger('debug.log'),
    History = require('./lib/History'),
    PianobarConfig = require('./pianobarConfig'),
    globals = {
        ipc: require('node-ipc'),
        Spawner: require('./spawnPianobar'),
        logger,
        History,
        io: require('socket.io'),
        response: require('./response'),
        log: logger.trace,
        currentTime: new History(20, { key: 'now' }), //apply something so it only updates when time.now is different
        current: new History(120, { key: 'coverArt' }),
        pastSongs: new History(50, { key: 'coverArt' }),
        isPlaying: new History(1),
        pianobarLog: new History(200),
        http: require('http'),
        port: 8081,
        url: require('url'),
        fs: require('fs'),
        path: require('path'),
        ipcResponse: require('./ipcResponse'),
        notifier: require('./lib/Notifier'),
        shortcuts: require('./lib/Shortcuts'),
        localtunnel: require('localtunnel'),
        opn: require('opn'),
        config: require('./config'),
        nodeCleanup: require('node-cleanup'),
        express: require('express'),
        pianobarConfig: new PianobarConfig(),
        chalk: require('chalk'),
    }
module.exports = globals