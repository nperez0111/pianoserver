function configHandlers(globals) {
    const { shortcuts } = globals
    return {
        listenShortcuts(oldConfig, newConfig, listenShortcuts) {
            if (listenShortcuts) {
                shortcuts.init(newConfig.shortcuts)
            } else if (shortcuts.active) {
                shortcuts.destroy()
            }
        },
        shortcuts(oldConfig, newConfig, newShortcuts) {
            if (shortcuts.active) {
                shortcuts.destroy()
            }
            shortcuts.init(newShortcuts)
        },
    }
}
module.exports = configHandlers