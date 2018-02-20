#!/usr/local/bin/node

const notifie = require('node-notifier').NotificationCenter,
    notifier = new notifie(),
    Connector = require('./Connector'),
    server = new Connector(),
    download = require('image-downloader'),
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg',
    possibleNotifications = {
        nowPlaying: {
            getFromServer: [{ name: 'getCurrentStatus', args: [1] }],
            downloadImage([resp]) {
                //console.log(resp)
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
    constructor() {
        this.notificationTypes = possibleNotifications
        this.getFromServer = this.getFromServer.bind(this)
        this.downloadImage = this.downloadImage.bind(this)
        this.notify = this.notify.bind(this)
    }
    getFromServer(data, map = (a => a)) {
        return server.getAll(data).then(map)
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
            })
        }
        if (downloadImage) {
            current = current.then(() => this.downloadImage(downloadImage(resp)))
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
            })

        }
        current.then(result => {
            return notifier.notify(notification || result, function () { /*console.log(arguments)*/ })
        })
        return current
    }
}

if (!module.parent) {
    const noti = new Notifier()
    noti.notify(possibleNotifications['selectStations'])
}

module.exports = Notifier