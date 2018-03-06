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
    pkg = require('./package.json'),
    conf = new Configstore(pkg.name, {
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
            shuffle: []
        },
        keys: {
            CTRL,
            SHIFT,
            ALT,
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
            BACK_SLASH: 43,
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
            Z,
            X: Z + 1,
            C: Z + 2,
            V: Z + 3,
            B: Z + 4,
            N: Z + 5,
            M,
            COMMA: M + 1,
            PERIOD: M + 2,
            FORWARD_SLASH: M + 3

        }
    })

module.exports = {
    config: conf,
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