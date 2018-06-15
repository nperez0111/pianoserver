const execa = require('execa'),
    path = require('path'),
    homedir = require('homedir')(),
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
        deleteStation: 'd',
        renameStation: 'r',
        history: 'h'
    }
let once = true
class Spawner {
    constructor(start, options) {
        this.stdin = options.stdin || process.stdin
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
            if (this.stdin.setRawMode) {
                this.stdin.setRawMode(true);
            }

            // resume this.stdin in the parent process (node app won't quit all by itself
            // unless an error or process.exit() happens)
            this.stdin.resume();

            // i don't want binary, do you?
            this.stdin.setEncoding('utf8');
            let lineByLine = false;
            // on any data into this.stdin
            this.stdin.on('data', key => {
                // ctrl-c ( end of text )
                if (key === '\u0003') {
                    this.options.onExit()
                    if (this.options.onExitCloseChild) {
                        this.pianobar.kill()
                    }
                    process.exit();
                }
                if (lineByLine || lineByLine === '') {
                    if (key === '\u000D') {
                        //ENTER/RETURN
                        this.pianobar.stdin.write(lineByLine + '/n')
                        lineByLine = false
                        return
                    } else if (key === '\u0008') {
                        //BACK_SPACE
                        lineByLine = lineByLine.slice(0, -1)
                    } else {
                        //ANY OTHER KEY
                        lineByLine += key
                    }
                    process.stdout.write(key)
                    return
                } else {
                    if (key === 's') {
                        lineByLine = ''
                        this.pianobar.stdin.write(key)
                        return
                    }
                }

                //send single char and flush this.stdin
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
if (!module.parent) {
    var proccess = new Spawner(true, {
        onExit: function (exitCode, signal) {
            process.exit()
        },
        onEnd: function () {
            process.exit()
        },
        onData: function (data) {
            console.log(data)
        }
    })
}