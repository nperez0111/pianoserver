const commands = ['userlogin', 'usergetstations', 'stationfetchplaylist', 'songstart', 'songfinish', 'defaultCommand', 'songlove'],
    splitter = stdin => stdin.split("\n").map(str => str.split("=")).reduce((obj, [key, value]) => {
        obj[key] = value
        return obj
    }, {})

function ipcResponse({ ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger }) {

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

        }

    }
    return ipcResponse
}

module.exports = ipcResponse