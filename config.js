const CTRL = 29,
    SHIFT = 42,
    ALT = 56,
    OPTION = 3640,
    LEFT_COMMAND = 3675,
    RIGHT_COMMAND = 3676,
    ESC = 1,
    F1 = 59,
    F2 = 60,
    F3 = 61,
    F4 = 62,
    F5 = 63,
    F6 = 64,
    F7 = 65,
    F8 = 66,
    F9 = 67,
    F10 = 68,
    F11 = 69,
    F12 = 69,
    MINUS = 12,
    PLUS = 13,
    LEFT = 57419,
    RIGHT = 57421,
    UP = 57416,
    DOWN = 57424,
    Q = 16,
    A = 30,
    Z = 44,
    P = 25,
    L = 38,
    M = 50,
    homedir = require('homedir')(),
    imageLoc = homedir + '/.config/pianobar/notificationImage.jpg',
    Configstore = require('configstore'),
    dotProp = require('dot-prop'),
    pkg = require('./package.json'),
    conf = new Configstore(pkg.name, {
        willRestart: false,
        showNotifications: true,
        openTunnelURL: true,
        listenShortcuts: true,
        shortcuts: {
            playPause: [CTRL, SHIFT, LEFT],
            nextSong: [CTRL, SHIFT, RIGHT],
            likeSong: [CTRL, SHIFT, UP],
            dislikeSong: [CTRL, SHIFT, DOWN],
            play: [],
            pause: [],
            shuffle: [],
            nowPlaying: [],
            selectStation: [CTRL, SHIFT, A + 1], //A+1 = S
        },
        keys: {
            CTRL,
            LEFT_SHIFT: SHIFT,
            LEFT_ALT: ALT,
            ESC,
            MINUS,
            PLUS,
            LEFT,
            RIGHT,
            UP,
            DOWN,
            F1,
            F2,
            F3,
            F4,
            F5,
            F6,
            F7,
            F8,
            F9,
            F10,
            F11,
            F12,
            BACK_TICK: 28,
            "1": 2,
            "2": 3,
            "3": 4,
            "4": 5,
            "5": 6,
            "6": 7,
            "7": 8,
            "8": 9,
            "9": 10,
            "0": 11,
            TAB: 15,
            Q,
            W: Q + 1,
            E: Q + 2,
            R: Q + 3,
            T: Q + 4,
            Y: Q + 5,
            U: Q + 6,
            I: Q + 7,
            O: Q + 8,
            P,
            LEFT_BRACKET: P + 1,
            RIGHT_BRACKET: P + 2,
            A,
            S: A + 1,
            D: A + 2,
            F: A + 3,
            G: A + 4,
            H: A + 5,
            J: A + 6,
            K: A + 7,
            L,
            COLON: L + 1,
            SINGLE_QUOTE: L + 2,
            BACK_SLASH: 43,
            Z,
            X: Z + 1,
            C: Z + 2,
            V: Z + 3,
            B: Z + 4,
            N: Z + 5,
            M,
            COMMA: M + 1,
            PERIOD: M + 2,
            FORWARD_SLASH: M + 3,
            SPACE: 28,
            RIGHT_ALT: 3640,
            RIGHT_SHIFT: 54,
            BACK_SPACE: 14,
            RIGHT_CTRL: 3613,
            LEFT_COMMAND: 3675,
            RIGHT_COMMAND: 3676,
            RIGHT_OPTION: OPTION,
            LEFT_OPTION: 56,

        }
    })


module.exports = {
    config: conf,
    copy() {
        return JSON.parse(JSON.stringify(conf.all))
    },
    get(key) {
        return conf.get(key)
    },
    set(key, value) {
        const before = this.copy()
        conf.set(key, value)
        const after = this.copy()

        if (dotProp.has(this.handlers, key)) {

            dotProp.get(this.handlers, key)(before, after, value)

        }
    },
    setAll(newConfig) {
        conf.all = newConfig
    },
    handlers: require('./configHandlers'),
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
        selectStation: (function () {
            var globals

            return {
                handler: function (err, handler, meta) {
                    const { response } = globals, handlers = {
                        replied: station => {
                            if (response) {
                                response.selectStation(null, globals)(station)
                            } else {
                                console.log("Would've switched the station to:", station)
                            }
                        }
                    }
                    if (err) {
                        return 'Welp we failed somehow'
                    }

                    if (handler in handlers) {
                        handlers[handler](meta.activationValue)
                    } else {
                        //console.log(type, meta)
                    }
                },
                cb(resp, allGlobals) {
                    globals = allGlobals

                    return {
                        message: 'Type in the name of the station which you would like to play',
                        title: 'What station would you like to play?',
                        reply: true,
                        timeout: 300,
                        icon: imageLoc,
                        contentImage: imageLoc
                    }

                }
            }
        })()
    }
}