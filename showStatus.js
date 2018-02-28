#!/usr/local/bin/node

const notifie = require('node-notifier').NotificationCenter,
    notifier = new notifie(),
    download = require('image-downloader'),
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg',
    possibleNotifications = {
        login: {
            notification: {
                title: `Welcome back to Pianobar!`
            }
        },
        songLiked: {
            getFromServer: [{ name: 'getCurrentStatus', args: [1] }],
            downloadImage([resp]) {
                return { url: resp[1].coverArt, dest: imageLoc }
            },
            cb([resp]) {
                if (resp.length == 1) {
                    return 'response was empty' + JSON.stringify(resp)
                }
                const [label, status, isPlaying] = resp, { artist, title, album, coverArt, stationName, songStationName, detailUrl } = status

                return {
                    message: `On:${album} @${stationName.includes('Radio')?stationName.slice(0,-6):stationName}`,
                    title: `${title} By: ${artist}`,
                    subtitle: `Has been liked! `,
                    icon: imageLoc,
                    contentImage: imageLoc
                }

            }
        },
        nowPlaying: {
            getFromServer: [{ name: 'getCurrentStatus', args: [1] }],
            downloadImage([resp]) {
                return { url: resp[1].coverArt, dest: imageLoc }
            },
            cb([resp]) {
                if (resp.length == 1) {
                    return 'response was empty' + JSON.stringify(resp)
                }
                const [label, status, isPlaying] = resp, { artist, title, album, coverArt, stationName, songStationName, detailUrl } = status

                return {
                    message: `On:${album} @${stationName.includes('Radio')?stationName.slice(0,-6):stationName}`,
                    title: `${isPlaying?'Now Playing:':'Paused:'} ${title}`,
                    subtitle: `By: ${artist}`,
                    icon: imageLoc,
                    contentImage: imageLoc
                }

            }
        },
        selectStations: {
            getFromServer: [{ name: 'getCurrentStatus', args: [1] }],
            cb([resp]) {
                if (resp.length == 1) {
                    return 'response was empty' + JSON.stringify(resp)
                }
                const [label, status, isPlaying] = resp, { stationCount } = status
                const stations = (new Array(parseInt(stationCount))).fill(false).map((c, i) => status[`station${i}`])
                console.log(stations)
                return {
                    title: 'Select Station',
                    message: 'What station would you like to play?',
                    reply: true,
                    timeout: 30,
                    replied: function (a) {
                        const getVal = obj => obj.activationValue
                        const val = getVal(a)
                        console.log(val)
                    },
                    activate: function (action) {
                        if (action.activationType == 'actionClicked') {
                            const val = action.activationValue
                            console.log(val)

                        }
                        console.log("user clicked", action)
                    },
                    actions: ['a', 'b'],
                    dropDownLabel: 'Station List'
                }
            }
        }
    }

class Notifier {
    constructor(globals) {
        this.notificationTypes = possibleNotifications
        this.getFromServer = this.getFromServer.bind(this)
        this.downloadImage = this.downloadImage.bind(this)
        this.notify = this.notify.bind(this)
        this.globals = globals
    }
    getFromServer(commandsToGet, map = (a => a)) {
        const { response } = this.globals
        //need to actually pull from the server rather than connect to it
        return Promise.all(commandsToGet.map(({ name, args }) => {
            //console.log(commandsToGet)
            return new Promise((resolve, reject) => {
                const time = setTimeout(() => { reject('timed out') }, 200)
                if (!response[name]) {
                    reject(name + 'is not a function on response')
                    return
                }
                const func = response[name]({
                    emit: function () {
                        clearTimeout(time)
                        resolve(Array.from(arguments))
                    }
                }, this.globals)

                func.apply(response, args)
            })

        }))

    }
    downloadImage({ url, dest }) {
        return download.image({ url, dest })
    }
    notify({ promise = true, cb, getFromServer = false, getFromServerMap = (a => a), downloadImage = false, notification = false }) {
        let current = Promise.resolve(),
            resp = null
        if (getFromServer) {
            current = current.then(() => {
                return this.getFromServer(getFromServer, getFromServerMap).then(response => {
                    resp = response
                    return response
                })
            }).catch(err => { console.log(err) })
        }
        if (downloadImage) {
            current = current.then(() => this.downloadImage(downloadImage(resp))).catch(err => { console.log(err) })
        }
        if (cb) {
            current = current.then(() => cb(resp)).then(notification => {
                //console.log(notification)
                if (typeof notification === 'string') {
                    const err = new Error(notification)
                    throw err
                    return err
                }
                return notification
            }).catch(err => { console.log(err) })

        }
        current.then(result => {
            return notifier.notify(notification || result, function () { /*console.log(arguments)*/ })
        }).catch(err => { console.log(err) })
        return current
    }
}

if (!module.parent) {
    const noti = new Notifier()
    noti.notify(possibleNotifications['selectStations'])
}

module.exports = Notifier