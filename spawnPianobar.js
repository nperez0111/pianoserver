const execa = require('execa'),
    logger = require('simple-node-logger').createSimpleLogger('debug.log'),
    path = require('path'),
    log = logger.info,
    stdin = process.stdin,
    mappings = {
        nextSong: 'n',
        dislikeSong: '-',
        likeSong: '+',
        quit: 'q',
        selectStation: 's ',
        playPauseSong: 'p',
        play: 'P',
        pause: 'p',
        playOrPauseSong: 'p',
        shuffle: 'x',
        createStation: 'c',
        createGenreStation: 'g',
        deleteStation: 'd'
    }
let once = true
class Spawner {
    constructor(start, options) {

        this.options = Object.assign({
            onExitCloseChild: true,
            takeInput: true,
            onExit: function (exitCode, signal) {

            },
            onEnd: function () {

            },
            onData: function (data) {

            }
        }, options)

        if (start === true && once) {
            this.pianobar = execa('./pianobar', { cwd: path.resolve(__dirname, 'pianobar') })
            this.setUpPianobar()
            once = false
        } else {
            this.pianobar = start
        }

    }
    setUpPianobar() {
        if (this.options.takeInput) {
            // without this, we would only get streams once enter is pressed
            if (stdin.setRawMode) {
                stdin.setRawMode(true);
            }

            // resume stdin in the parent process (node app won't quit all by itself
            // unless an error or process.exit() happens)
            stdin.resume();

            // i don't want binary, do you?
            stdin.setEncoding('utf8');

            // on any data into stdin
            stdin.on('data', key => {
                // ctrl-c ( end of text )
                if (key === '\u0003') {
                    this.options.onExit()
                    if (this.options.onExitCloseChild) {
                        this.pianobar.kill()
                    }
                    process.exit();
                }

                //send single char and flush stdin
                this.pianobar.stdin.write(key + "\n")

                // write the key to stdout all normal like
                process.stdout.write(key)
            })
        }
        this.pianobar.stdout.setEncoding('utf8')

        this.pianobar.stdout.on('data', this.options.onData)

        this.pianobar.stdout.on('end', this.options.onEnd)

        this.pianobar.on('exit', this.options.onExit)

        if (this.options.onExitCloseChild) {
            process.on('exit', () => {
                this.pianobar.kill()
            })
            process.on('SIGINT', () => {
                this.pianobar.kill()
            });
        }

    }
    getPianobar() {
        return this.pianobar
    }
    writeCommand(key) {
        if (key in mappings) {
            this.pianobar.stdin.write(mappings[key] + "\n")
            return true
        }
        this.pianobar.stdin.write(key + "\n")
        return false
    }
    respawn() {
        once = true
        //other respawn code
    }
}

module.exports = Spawner