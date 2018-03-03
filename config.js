const CTRL = 29,
    SHIFT = 42,
    P = 25,
    ALT = 56,
    F1 = 59,
    F7 = 65,
    PLUS = 13,
    LEFT = 57419,
    RIGHT = 57421,
    UP = 57416,
    DOWN = 57424,
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg',
    Configstore = require('configstore'),
    pkg = require('./package.json'),
    conf = new Configstore(pkg.name, { defaultValue: true })

module.exports = {
    config: conf,
    shortcuts: {
        playPause: [CTRL, SHIFT, LEFT],
        nextSong: [CTRL, SHIFT, RIGHT],
        likeSong: [CTRL, SHIFT, UP],
        dislikeSong: [CTRL, SHIFT, DOWN]
    },
    notifications: {
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
                    replied: function(a) {
                        const getVal = obj => obj.activationValue
                        const val = getVal(a)
                        console.log(val)
                    },
                    activate: function(action) {
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
}