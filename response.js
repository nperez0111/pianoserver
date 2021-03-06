const wait = amount => new Promise((resolve, reject) => setTimeout(resolve, amount)),
    Response = {
        init: (client, obj) => {
            const { current, isPlaying, currentTime } = obj
            return () => {
                obj.status = current.onpush((state, size) => {
                    client.emit('status', JSON.stringify(state))
                    client.emit('allStatus', JSON.stringify(current.store))
                })

                obj.isPlayingHandler = isPlaying.onpush((state) => {
                    console.log(state ? 'Playing' : 'Paused')
                    client.emit('isPlaying', state)
                })

                obj.timeInterval = setInterval(function () {
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
                } else {
                    //client is out of sync send them an update
                    client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
                }
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
                } else {
                    //client is out of sync send them an update
                    client.emit('getCurrentStatus', [current.getNewest(), isPlaying.getNewest()])
                }
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
        renameCurrentStation: (client, globals) => {
            const { spawnInstance, isPlaying } = globals
            return (stationName) => {
                //logger.info('got a request to add station ' + stationName)

                spawnInstance.writeCommand("renameStation")
                spawnInstance.writeCommand(stationName)

            }
        },
        renameStation: (client, globals) => {
            return (stationName, newName) => {

                Response.selectStation(client, globals)(stationName)
                wait(300).then(() => {
                    Response.renameCurrentStation(client, globals)(newName)
                })
            }
        },
        goBackToSong: (client, { spawnInstance, logger }) => {
            return (songAgo) => {
                //logger.info('got a request to add station ' + artistOrSongName)

                spawnInstance.writeCommand("history")
                spawnInstance.writeCommand(songsAgo)
            }
        },
        addVarietyToCurrentStation: (client, { spawnInstance, logger }) => {
            return (artistOrSongName) => {
                //logger.info('got a request to add station ' + artistOrSongName)

                spawnInstance.writeCommand("addToStation")
                spawnInstance.writeCommand(artistOrSongName)
            }
        },
        addVariety: (client, globals) => {
            return (stationName, artistOrSongName) => {
                Response.selectStation(client, globals)(stationName)
                wait(300).then(() => {
                    Response.addVarietyToCurrentStation(client, globals)(artistOrSongName)
                })

            }
        },
        writeCommand: (client, { spawnInstance, logger }) => {
            return command => {
                //logger.info("Writing command to pianobar instance", command)
                spawnInstance.writeCommand(command)
            }
        },
        getConfig: (client, { config, pianobarConfig }) => {
            return () => {
                client.emit('getConfig', config.copy(), pianobarConfig.getAll())
            }
        },
        setAllConfig: (client, { config, shortcuts }) => {
            return (newConfig) => {
                const before = config.get('listenShortcuts')
                config.setAll(newConfig)
            }
        },
        killInstance: () => {
            return () => {
                Response.writeCommand(null, globals)('q')
            }
        },
        restartPianobar: (client, { config, ServerCommands }) => {
            const failed = () => {
                client.emit('restartPianobar', false)
                config.set('willRestart', false)
            }
            return () => {
                ServerCommands.checkIfRunning().then(() => {
                    config.set('willRestart', true)
                    ServerCommands.restartServer().then(() => {
                        client.emit('restartPianobar', true)
                    }).catch(failed)
                }).catch(failed)
            }
        },
        quitPianobar: (client, { ServerCommands }) => {
            const quitter = () => {
                Response.killInstance()()
                client.emit('quitPianobar', true)
            }
            return () => {
                ServerCommands.checkIfRunning().then(ServerCommands.quitServer).catch(quitter).then(quitter)
            }
        },
        setConfig: (client, { config }) => {
            return (key, value) => {
                console.log("setting:", key, "to:", value)
                config.set(key, value)
            }
        },
        setPassword: (client, { pianobarConfig }) => {
            return (password) => {
                pianobarConfig.setPassword(password)
            }
        },
        getStationIDNumber: (client, { pianobarLog }) => {
            return () => {
                const regex = /  Now Playing "(.+)" .+\(([0-9]+)\)/g
                const found = pianobarLog.getNewest(pianobarLog.size).find(line => {
                    return regex.test(line)
                })
                regex.exec(found)
                if (found) {
                    console.log(found)
                    let [line, stationName, stationIDNumber] = regex.exec(found)
                    client.emit('getStationIDNumber', stationIDNumber)
                } else {
                    console.log('no matches found')
                    //maybe try reading it for the file
                    client.emit('getStationIDNumber', null)
                }
            }
        },
        setAutostart: (client, globals) => {
            const { pianobarLog, pianobarConfig } = globals

            return () => {
                (new Promise((resolve, reject) => {
                    Response.getStationIDNumber({
                        emit: (label, stationIDNumber) => {
                            if (id === null) {
                                reject('No station ID found.')
                            } else {
                                resolve(stationIDNumber)
                            }
                        }
                    }, globals)
                })).then(stationIDNumber => {
                    pianobarConfig.set('autostart_station', stationIDNumber)
                }).catch(() => {
                    console.log("attempted to set autostart but couldn't find station ID")
                })
            }
        },
        disconnect: (client, { current, timeInterval, status, isPlayingHandler, isPlaying, log }) => {
            return () => {
                clearInterval(timeInterval)
                current.unpush(status)
                isPlaying.unpush(isPlayingHandler)
            }
        }

    }
module.exports = Response