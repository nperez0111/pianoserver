const serverName = 'pianobar-server'

class Connector {
    constructor() {
        this.ipc = require('node-ipc')
        this.ipc.config.id = 'pianobar-status'
        this.ipc.config.retry = 1500
        this.ipc.config.silent = true
    }
    connectToServer(cb) {
        return new Promise((resolve, reject) => {
            this.ipc.connectTo(serverName, () => {
                const resp = [this.ipc.of[serverName], this.ipc]
                resolve(resp)
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
                    resolve([response, client, this.ipc])
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
    on(command, args) {
        return new Promise((resolve, reject) => {
            this.connectToServer().then(([client, ipc]) => {
                const timeout = setTimeout(() => { reject("Too Long To Respond") }, 6000)

                client.on('connect', () => {
                    client.emit.apply(client, [command].concat(args))
                    clearTimeout(timeout)
                    resolve(client, ipc[serverName])
                })

            })
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
        this.ipc.disconnect()
        return new Connector()
    }
}

module.exports = Connector