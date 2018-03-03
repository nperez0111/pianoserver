#!/usr/local/bin/node

const ipc = require('node-ipc'),
    serverName = 'pianobar-server'

ipc.config.id = 'pianobar-stdin'
ipc.config.retry = 1500
ipc.config.silent = true



ipc.connectTo(serverName, () => {
    //console.log('yet to connect')
    ipc.of[serverName].on('connect', () => {
        //console.log('connected')
        ipc.of[serverName].emit('getCurrentTime');

    });

    ipc.of[serverName].on('getCurrentTime', (currentTime) => {
        console.log(currentTime)
        ipc.of[serverName].emit('getStatus', "Dope");
        //ipc.disconnect(serverName)
    })

    ipc.of[serverName].on('getStatus', (current) => {
        console.log(current)
        //ipc.disconnect(serverName)
    })
    ipc.of[serverName].on('getLine', line => {
        console.log(line)
    })
})