#!/usr/local/bin/node

const notifie = require('node-notifier').NotificationCenter,
    notifier = new notifie(),
    download = require('image-downloader'),
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg',
    config = require('../config'),
    possibleNotifications = config.notifications

class Notifier {
    constructor(globals) {
        this.notificationTypes = possibleNotifications
        this.getFromServer = this.getFromServer.bind(this)
        this.downloadImage = this.downloadImage.bind(this)
        this.notify = this.notify.bind(this)
        this.globals = globals
    }
    getFromServer(commandsToGet, map = (a => a)) {
        const { response } = this.globals || { response: {} }
        //need to actually pull from the server rather than connect to it
        return Promise.all(commandsToGet.map(({ name, args }) => {
            //console.log(commandsToGet)
            return new Promise((resolve, reject) => {
                const time = setTimeout(() => { reject('timed out') }, 200)
                if (!response[name]) {
                    if (!this.globals) {
                        return reject('globals are not set on Notifier')
                    }
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
    notify({ promise = true, cb, getFromServer = false, getFromServerMap = (a => a), downloadImage = false, notification = false, handler = false }) {
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
            current = current.then(() => cb(resp, this.globals || {})).then(notification => {
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
            return notifier.notify(Object.assign({ group: 'pianoserver', ignoreDnD: true }, notification || result), handler || function (err, thing) { console.log(err, thing) })
        }).catch(err => { console.error(err) })
        return current
    }
}

if (!module.parent) {
    const noti = new Notifier()
    noti.notify(possibleNotifications['selectStation'])
}

module.exports = Notifier