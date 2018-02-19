const commands = ['userlogin', 'usergetstations', 'stationfetchplaylist', 'songstart', 'songfinish', 'defaultCommand', 'songlove'],
    splitter = stdin => stdin.split("\n").map(str => str.split("=")).reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
    }, {})

function ipcResponse({ ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger, response } = globals) {

    const ipcResponse = {
        cli: function ([command, stdin], socket) {
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
        },
        getCurrentTime: function (command, socket) {
            log('got a request for current time')

            ipc.server.emit(socket, 'getCurrentTime', currentTime.getNewest())
        },
        getStatus: function (command, socket) {
            log('got a request for current status')

            ipc.server.emit(socket, 'getStatus', current.getNewest())
        },
        getAllStatus: function (command, socket) {
            log('got a request for current status')

            ipc.server.emit(socket, 'getAllStatus', current.getAll())
        },
        connect: function () {

        },
        play: function (command, socket) {
            response.play({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        pause: function (command, socket) {
            response.pause({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        nextSong: function (command, socket) {
            response.nextSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        likeSong: function (command, socket) {
            response.likeSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        dislikeSong: function (command, socket) {
            response.dislikeSong({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(current.getNewest())
        },
        selectStation: function (command, socket) {
            response.selectStation({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(command)
        },
        shuffle: function (command, socket) {
            response.shuffle({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)()
        },
        getPastSongs: function (command, socket) {
            response.getPastSongs({ emit: ipc.server.emit.bind(ipc.server, socket) }, globals)(command)
        }
    }
    return ipcResponse
}

module.exports = ipcResponse