const Response = {
    init: (client, obj) => {
        const { current, isPlaying, currentTime } = obj
        return () => {
            obj.status = current.onpush((state, size) => {
                client.emit('status', JSON.stringify(state))
                client.emit('allStatus', JSON.stringify(current.store))
            })

            obj.isPlayingHandler = isPlaying.onpush((state) => {
                console.log(state ? 'is playing' : 'is not playing')
                client.emit('isPlaying', state)
            })

            obj.timeInterval = setInterval(function () {
                client.volatile.emit('currentTime', currentTime.getNewest(), isPlaying.getNewest());
            }, 1000)
        }
    },
    getCurrentTime: (client, { currentTime, log }) => {
        return (howMany) => {
            log('got a request for current time')
            client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
        }
    },
    getCurrentStatus: (client, { current, isPlaying, log }) => {
        return howMany => {
            log('got a request for current status')
            client.emit('getCurrentStatus', current.getNewest(parseInt(howMany)), isPlaying.getNewest())
        }
    },
    getPastSongs: (client, { pastSongs, log }) => {
        return (howMany) => {
            log('got a request for past Songs')
            if (howMany) {
                client.emit('getPastSongs', pastSongs.getNewest(parseInt(howMany)))
            } else {
                client.emit('getPastSongs', pastSongs.getAll())
            }
        }
    },
    getIsPlaying: (client, { isPlaying }) => {
        return () => client.emit('getIsPlaying', isPlaying.getNewest())
    },
    play: (client, { spawnInstance, isPlaying, current, currentTime, log }) => {
        return (clientStatus, clientTime) => {
            log('got a request to play')
            //client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
            if (isPlaying.getNewest() === false) {
                spawnInstance.writeCommand("play")
            } else {
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }
            currentTime.clear()
            isPlaying.push(true)

        }
    },
    pause: (client, { spawnInstance, isPlaying, current, currentTime, log }) => {
        return (clientStatus, clientTime) => {
            log('got a request to pause')
            //client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
            if (isPlaying.getNewest() === true) {
                spawnInstance.writeCommand("pause")
            } else {
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }
            currentTime.clear()
            isPlaying.push(true)
        }
    },
    likeSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus, clientTime) => {
            log('got a request to like')
            //make sure to like the right song
            if (clientStatus && clientStatus.title === current.getNewest().title) {
                spawnInstance.writeCommand("likeSong")
            } else {
                //client is out of sync send them an update
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }
        }
    },
    dislikeSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus, clientTime) => {
            log('got a request to dislike')
            //make sure to like the right song
            if (clientStatus && clientStatus.title === current.getNewest().title) {
                spawnInstance.writeCommand("dislikeSong")
            } else {
                //client is out of sync send them an update
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }
        }
    },
    nextSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus, clientTime) => {
            log('got a request to skip', clientStatus && clientStatus.title, "current song is", current.getNewest().title)
            //make sure to skip the correct song
            if (clientStatus && clientStatus.title === current.getNewest().title) {
                spawnInstance.writeCommand("nextSong")
                isPlaying.push(true)
            } else {
                //client is out of sync send them an update
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }

        }
    },
    selectStation: (client, { spawnInstance, isPlaying, logger }) => {
        return (stationID) => {
            logger.info('got a request to change station to ' + stationID)

            spawnInstance.writeCommand("selectStation")
            spawnInstance.writeCommand(stationID)
            isPlaying.push(true)
        }
    },
    shuffle: (client, { isPlaying, spawnInstance, log }) => {
        return () => {
            log('got a request to change station to shuffle')
            spawnInstance.writeCommand("shuffle")
            isPlaying.push(true)
        }
    },
    disconnect: (client, { current, timeInterval, status, isPlayingHandler, isPlaying, log }) => {
        return () => {
            clearInterval(timeInterval)
            current.unpush(status)
            isPlaying.unpush(isPlayingHandler)
            log('Client has disconnected');
        }
    }

}
module.exports = Response