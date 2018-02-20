const ioHook = require('iohook')

function noop() {}
module.exports = function (globals, shortcutMappings) {
    const { ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger, response, notifier } = globals;

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
        methods = {
            playPause() {
                if (isPlaying.getNewest()) {
                    response.pause({ emit: () => false }, globals)()
                } else {
                    response.play({ emit: () => false }, globals)()
                }
            },
            play: function (command, socket) {
                response.play({ emit: noop }, globals)()
            },
            pause: function (command, socket) {
                response.pause({ emit: noop }, globals)()
            },
            nextSong: function (command, socket) {
                response.nextSong({ emit: noop }, globals)(current.getNewest())
            },
            likeSong: function (command, socket) {
                response.likeSong({ emit: noop }, globals)(current.getNewest())
            },
            dislikeSong: function (command, socket) {
                response.dislikeSong({ emit: noop }, globals)(current.getNewest())
            },
            selectStation: function (command, socket) {
                response.selectStation({ emit: noop }, globals)(command)
                //going to need some sort of notification for this one
            },
            shuffle: function (command, socket) {
                response.shuffle({ emit: noop }, globals)()
            }
        },
        shortcuts = {
            playPause: [CTRL, SHIFT, LEFT],
            nextSong: [CTRL, SHIFT, RIGHT],
            likeSong: [CTRL, SHIFT, UP],
            dislikeSong: [CTRL, SHIFT, DOWN],

        },
        allShortcutHandlers = []

    ioHook.start()

    Object.keys(shortcutMappings || shortcuts).forEach(key => {
        const shortcut = shortcuts[key],
            handler = methods[key],
            id = ioHook.registerShortcut(shortcut, handler)

        //console.log('Registered', key)
        allShortcutHandlers.push(id)
    })

    return {
        destroy: () => {
            allShortcutHandlers.forEach(id => {
                ioHook.unregisterShortcut(id)
            })
            ioHook.unload()
            ioHook.unregisterAllShortcuts()
            ioHook.stop()
        },
        shortcuts,
        allShortcutHandlers,
        ioHook,
        methods
    }
}