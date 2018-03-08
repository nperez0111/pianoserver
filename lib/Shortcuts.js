const ioHook = require('iohook')

function noop() {}
module.exports = function (globals, shortcutMappings) {
    const { ipc, current, pastSongs, log, currentTime, isPlaying, spawnInstance, logger, response, notifier, config } = globals;

    const methods = {
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
            },
            nowPlaying: function (command, socket) {
                const { notify, notificationTypes } = new notifier(globals)
                notify(notificationTypes.nowPlaying)
            }
        },
        shortcuts = config.config.get('shortcuts'),
        allShortcutHandlers = []



    const ret = {
        active: false,
        init: (moreShortcuts) => {
            ioHook.start()
            ret.active = true
            Object.keys(moreShortcuts || shortcutMappings || shortcuts).forEach(key => {
                const shortcut = shortcuts[key],
                    handler = methods[key],
                    id = ioHook.registerShortcut(shortcut, handler)

                //console.log('Registered', key)
                allShortcutHandlers.push(id)
            })
        },
        destroy: () => {
            ret.active = false
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
    return ret
}

if (!module.parent) {
    //module.exports({})
    ioHook.start()
    ioHook.on("keydown", function (msg) { console.log(msg); });
    const CTRL = 29,
        SHIFT = 42,
        P = 25,
        ALT = 56,
        F1 = 59,
        F7 = 65;

    ioHook.registerShortcut([CTRL, SHIFT, P], (keys) => {
        console.log('Shortcut pressed with keys:', keys);
    });

    let shId = ioHook.registerShortcut([ALT, F7], (keys) => {
        console.log('This shortcut will be called once. Keys:', keys);
        ioHook.unregisterShortcut(shId);
    })

    console.log('Hook started. Try type something or move mouse');
}