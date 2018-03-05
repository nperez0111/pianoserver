const Response = {
    init: (client, obj) => {
        const { current, isPlaying, currentTime } = obj
        return () => {
            obj.status = current.onpush((state, size) => {
                client.emit('status', JSON.stringify(state))
                client.emit('allStatus', JSON.stringify(current.store))
            })

            obj.isPlayingHandler = isPlaying.onpush((state) => {
                console.log(state ? 'now playing\n' : 'paused\n')
                client.emit('isPlaying', state)
            })

            obj.timeInterval = setInterval(function() {
                client.volatile.emit('currentTime', currentTime.getNewest(), isPlaying.getNewest());
            }, 1000)
        }
    },
    getCurrentTime: (client, { currentTime, log }) => {
        return (howMany) => {
            //log('got a request for current time')
            client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
        }
    },
    getCurrentStatus: (client, { current, isPlaying, log }) => {
        return howMany => {
            //log('got a request for current status')
            client.emit('getCurrentStatus', current.getNewest(parseInt(howMany)), isPlaying.getNewest())
        }
    },
    getPastSongs: (client, { pastSongs, log }) => {
        return (howMany) => {
            //log('got a request for past Songs')
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
        return () => {
            //log('got a request to play')

            spawnInstance.writeCommand("play")
            currentTime.clear()
            isPlaying.push(true)

        }
    },
    pause: (client, { spawnInstance, isPlaying, current, currentTime, log }) => {
        return (clientStatus, clientTime) => {
            //log('got a request to pause')
            //client.emit('getCurrentTime', currentTime.getNewest(parseInt(howMany)))
            if (isPlaying.getNewest() === true) {
                spawnInstance.writeCommand("pause")
                currentTime.clear()
                isPlaying.push(false)
            } else {
                client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
            }

        }
    },
    likeSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus) => {
            //log('got a request to like')
            const curStatus = current.getNewest()
            //make sure to like the right song
            if (clientStatus && clientStatus.title === curStatus.title) {
                spawnInstance.writeCommand("likeSong")
                curStatus.rating = "1"
                current.push(curStatus)
            }
            //client is out of sync send them an update
            //client.emit('getCurrentStatus', [curStatus, isPlaying.getNewest()])
        }
    },
    dislikeSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus, clientTime) => {
            //log('got a request to dislike')
            const curStatus = current.getNewest()
            //make sure to like the right song
            if (clientStatus && clientStatus.title === curStatus.title) {
                spawnInstance.writeCommand("dislikeSong")
                curStatus.rating = "-1"
                current.push(curStatus)
            }
            //client is out of sync send them an update
            //client.emit('getCurrentStatus', [curStatus, isPlaying.getNewest()])
        }
    },
    nextSong: (client, { spawnInstance, current, isPlaying, log }) => {
        return (clientStatus, clientTime) => {
            //log('got a request to skip', clientStatus && clientStatus.title, "current song is", current.getNewest().title)
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
            //logger.info('got a request to change station to ' + stationID)

            spawnInstance.writeCommand("selectStation")
            spawnInstance.writeCommand(stationID)
            isPlaying.push(true)
        }
    },
    shuffle: (client, { isPlaying, spawnInstance, log }) => {
        return () => {
            //log('got a request to change station to shuffle')
            spawnInstance.writeCommand("shuffle")
            isPlaying.push(true)
        }
    },
    deleteStation: (client, { spawnInstance, isPlaying, logger }) => {
        return (stationID) => {
            //logger.info('got a request to delete station: ' + stationID)

            spawnInstance.writeCommand("deleteStation")
            spawnInstance.writeCommand(stationID)
        }
    },
    createGenreStation: (client, { spawnInstance, isPlaying, logger }) => {
        return (genre) => {
            //logger.info('got a request to add genre station ' + genre)

            spawnInstance.writeCommand("createGenreStation")
            spawnInstance.writeCommand(genre)
            isPlaying.push(true)
        }
    },
    createStation: (client, { spawnInstance, isPlaying, logger }) => {
        return (stationName) => {
            //logger.info('got a request to add station ' + stationName)

            spawnInstance.writeCommand("createStation")
            spawnInstance.writeCommand(stationName)
            isPlaying.push(true)
        }
    },
    addMusicToStation: (client, { spawnInstance, logger }) => {
        return (artistOrSongName) => {
            //logger.info('got a request to add station ' + artistOrSongName)

            spawnInstance.writeCommand("addToStation")
            spawnInstance.writeCommand(artistOrSongName)
        }
    },
    writeCommand: (client, { spawnInstance, logger }) => {
        return command => {
            //logger.info("Writing command to pianobar instance", command)
            spawnInstance.writeCommand(command)
        }
    },
    getConfig: (client, { config }) => {
        return () => {
            client.emit('getConfig', config.config.all)
        }
    },
    config: (client, { config }) => {
        return (key, value) => {
            config.config.set(key, value)
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