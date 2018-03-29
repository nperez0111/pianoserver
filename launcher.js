const serverCommands = require('./serverCommands'),
    startServer = serverCommands.startServer,
    quitServer = serverCommands.quitServer,
    restartServer = serverCommands.restartServer,
    checkIfRunning = serverCommands.checkIfRunning,
    express = require('express'),
    app = express(),
    pm2 = require('pm2'),
    path = require('path')
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
app.get('/startServer', (req, res) => {
    checkIfRunning().then(() => {
        res.send("running")
    }).catch(() => {
        const subdomain = 'pianoserver',
            port = 8081

        startServer(subdomain, port).then(() => {
            res.send('started')
        }).catch(() => {
            res.send('failed')
        })
    })
})
app.get('/restartServer', (req, res) => {
    checkIfRunning().then(() => {
        restartServer().then(() => {
            res.send('restarting')
        }).catch(() => {
            res.send('failed')
        })
    }).catch(() => {
        res.send('not running')
    })
})
app.get('/quitServer', (req, res) => {
    checkIfRunning().then(() => {
        quitServer().then(() => {
            res.send('quitted')
        }).catch(() => {
            res.send('failed')
        })
    }).catch(() => {
        res.send('not running')
    })
})
app.get('/serverStatus', (req, res) => {
    checkIfRunning().then(() => {
        res.send('running')
    }).catch(() => {
        res.send('not running')
    })
})
app.get('/', (req, res) => res.send('running'))
app.listen(8082)