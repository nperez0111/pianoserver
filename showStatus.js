#!/usr/local/bin/node

const notifier = require('node-notifier'),
    Connector = require('./Connector'),
    server = new Connector(),
    download = require('image-downloader'),
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg'

function Notify() {
    return server.getAll([{ name: 'getCurrentStatus', args: [1] }]).then(([resp]) => {
        if (resp.length == 1) {
            throw Error('response was empty' + JSON.stringify(resp))
        }
        const [label, status, isPlaying] = resp, { artist, title, album, coverArt, stationName, songStationName } = status

        return download.image({ url: coverArt, dest: imageLoc }).then(() => {
            return {
                message: `by:${artist} on:${album} @${stationName}`,
                title,
                icon: imageLoc
            }
        }).catch(err => console.log(err))

    }).catch(err => console.log(err))
}

class Notifier {
    constructor() {

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
            return notifier.notify(notification || result)
        })
        return current
    }
}

if (!module.parent) {
    const noti = new Notifier()
    noti.notify({
        getFromServer: [{ name: 'getCurrentStatus', args: [1] }],
        downloadImage([resp]) {
            //console.log(resp)
            return { url: resp[1].coverArt, dest: imageLoc }
        },
        cb([resp]) {
            if (resp.length == 1) {
                return 'response was empty' + JSON.stringify(resp)
            }
            const [label, status, isPlaying] = resp, { artist, title, album, coverArt, stationName, songStationName } = status

            return {
                message: `On:${album} @${stationName.includes('Radio')?stationName.slice(0,-6):stationName}`,
                title: `${isPlaying?'Now Playing:':'Paused:'} ${title} By: ${artist}`,
                icon: imageLoc
            }

        }
    })
}

module.exports = Notify