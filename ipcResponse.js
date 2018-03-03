const commands = ['userlogin', 'usergetstations', 'stationfetchplaylist', 'songstart', 'songfinish', 'defaultCommand', 'songlove'],
    splitter = stdin => stdin.split("\n").map(str => str.split("=")).reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
    }, {})

function ipcResponse(globals) {

    const { ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger, response, notifier, pianobarLog } = globals,
    ipcResponse = {
        cli: function([command, stdin], socket) {
            //log('command:', command)
            if (commands.includes(command)) {
                //console.log(command)

                const status = splitter(stdin)
                if (command == 'stationfetchplaylist' || command == 'usergetstations') {
                    //console.log(status)
                }
                current.push(status)
                pastSongs.push(status)
                const map = { songstart: 'nowPlaying', songlove: 'songLiked', userlogin: 'login' }
                if (command in map) {
                    const { notify, notificationTypes } = new notifier(globals)
                    notify(notificationTypes[map[command]]).catch(err => {})
                }
                //log(status)
            } else {
                console.log(command, "called with nothing to handle it")
                //commands.defaultCommand(stdin)
            }
        },
        getCurrentTime: function(command, socket) {
            log('got a request for current time')

            ipc.server.emit(socket, 'getCurrentTime', currentTime.getNewest())
        },
        getStatus: function(command, socket) {
            log('got a request for current status')

            ipc.server.emit(socket, 'getStatus', current.getNewest(command))
        },
        getAllStatus: function(command, socket) {
            log('got a request for current status')

            ipc.server.emit(socket, 'getAllStatus', current.getAll())
        },
        connect: function(socket) {
            pianobarLog.onpush(line => {
                ipc.server.emit(socket, 'getLine', line)
                ipc.server.emit(socket, 'getAllLines', pianobarLog.getAll())
            })
        },
        sendLine: function(command, socket) {
            response.writeCommand({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(command)
        },
        play: function(socket) {
            response.play({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        pause: function(socket) {
            response.pause({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        nextSong: function(socket) {
            response.nextSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        likeSong: function(socket) {
            response.likeSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        dislikeSong: function(socket) {
            response.dislikeSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        selectStation: function(command, socket) {
            response.selectStation({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(command)
        },
        shuffle: function(command, socket) {
            response.shuffle({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        getPastSongs: function(command, socket) {
            response.getPastSongs({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(command)
        },
        getIsPlaying: function(command, socket) {
            response.getisPlaying({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        get: function(commandsToGet, socket) {
            Promise.all(commandsToGet.map(({ name, args }) => {
                //console.log(commandsToGet)
                return new Promise((resolve, reject) => {
                    const time = setTimeout(() => { resolve('timed out') }, 200)
                    if (!response[name]) {
                        resolve(name + 'is not a function on response')
                        return
                    }
                    const func = response[name]({
                        emit: function() {
                            clearTimeout(time)
                            resolve(Array.from(arguments))
                        }
                    }, globals)

                    func.apply(null, args)
                })

            })).then(responses => {
                //console.log(JSON.stringify(responses))
                ipc.server.emit(socket, 'get', responses)
            })
        }
    }
    return ipcResponse
}

module.exports = ipcResponse