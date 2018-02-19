const ipc = require('node-ipc'),
    serverName = 'pianobar-server'

ipc.config.id = 'pianobar-status'
ipc.config.retry = 1500
ipc.config.silent = true

class Connector {
    constructor() {}
    connectToServer(cb) {
        return new Promise((resolve, reject) => {
            ipc.connectTo(serverName, () => {
                const resp = [ipc.of[serverName], ipc]
                cb(resp)

            })
        })

    }
    callAndResponse(eventName, once = true, connected = false) {
        return new Promise((resolve, reject) => {
            (this.connectToServer(([client, ipc]) => {
                if (connected === false) {
                    client.on('connect', () => {

                        client.emit(eventName)
                    })
                }
                let timeout = setTimeout(() => { reject("Too Long To Respond") }, 6000)
                client.on(eventName, (response) => {
                    if (once) {
                        this.close()
                    }
                    clearTimeout(timeout)
                    resolve([response, client, ipc])
                })

            }))
        })
    }
    getCurrentTime(once = true) {
        return this.callAndResponse('getCurrentTime', once)
    }
    getCurrentStatus(once = true) {
        return this.callAndResponse('getStatus', once)
    }
    getStatusAndTime(once = true) {
        return this.getCurrentStatus(false).then((status, client, ipc) => {
            const resp = this.callAndResponse('getCurrentTime', once, Promise.resolve([client, ipc]))
            client.emit('getCurrentTime')
            return resp.then((currentTime, client, ipc) => {
                return [status, currentTime, client, ipc]
            })
        })
    }
    on(eventName, cb, alreadyConnected) {
        (alreadyConnected || this.connectToServer()).then(([client, ipc]) => {
            client.on(eventName, cb)
        })
    }
    getAll(events, once = true) {
        return new Promise((resolve, reject) => {
            (this.connectToServer(([client, ipc]) => {

                let timeout = setTimeout(() => { reject("Too Long To Respond") }, 6000)
                client.on('get', (response) => {
                    if (once) {
                        this.close()
                    }
                    clearTimeout(timeout)
                    resolve(response)
                })
                client.on('connect', () => {

                    client.emit('get', events)
                })

            }))
        })
    }
    close() {
        ipc.disconnect()
    }
}

module.exports = Connector