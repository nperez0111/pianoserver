const commandExists = require('command-exists'),
    execa = require('execa'),
    log = console.log.bind(console),
    brew = execa.bind(execa, 'brew'),
    mkfifo = execa.bind(execa, 'mkfifo'),
    os = require('os'),
    make = execa.bind(execa, 'make', ['-j', os.cpus().length - 1]),
    npm = execa.bind(execa, 'npm'),
    installBrew = () => execa('/usr/bin/ruby', ['-e', '"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"']),
    homedir = require('homedir')(),
    path = require('path'),
    fs = require('fs'),
    del = require('del'),
    util = require('util'),
    ghdownload = require('github-download'),
    inquirer = require('inquirer'),
    serverCommands = require('./serverCommands'),
    logToFile = (file) => {
        const log_file = fs.createWriteStream(file, { flags: 'w' })
        return {
            log: function (line) {
                log_file.write(util.format(line));
            },
            logLine: function (line) {
                log_file.write(util.format(line) + '\n');
            },
            newLine: function () {
                log_file.write('\n')
            },
            makeExecutable: function (cb) {
                fs.chmod(file, 0755, cb)
            }
        }
    },
    err = console.error.bind(console),
    PianobarConfig = require('./pianobarConfig'),
    configLoc = path.resolve(homedir, '.config'),
    pianobarConfigPath = path.resolve(configLoc, 'pianobar'),
    configPath = path.resolve(pianobarConfigPath, 'config'),
    ctlPath = path.resolve(pianobarConfigPath, 'ctl'),
    pianobarLocalLoc = path.resolve(__dirname, 'pianobar'),
    pianobarExecutableLoc = path.resolve(pianobarLocalLoc, 'pianobar'),
    nodeBinLoc = path.resolve(path.resolve(path.resolve(__dirname, 'node_modules'), '.bin'), 'pianobar'),
    downloadPianobar = () => new Promise((resolve, reject) => ghdownload('https://github.com/PromyLOPh/pianobar.git', pianobarLocalLoc).on("error", reject).on("end", resolve)),
    makePianobar = () => make({
        stdio: 'inherit',
        env: process.env,
        cwd: pianobarLocalLoc
    }),
    buildUI = () => npm(['run', 'build'], { cwd: path.resolve(__dirname, 'client') }),
    fileExists = path => fs.existsSync(path) ? Promise.resolve(true) : Promise.reject(false),
    makedirIfNotExists = path => execa('mkdir', ['-p', path]),
    copyFile = (source, target) => {
        log(source, target)
        const rd = fs.createReadStream(source),
            wr = fs.createWriteStream(target)
        return new Promise((resolve, reject) => {
            rd.on('error', reject)
            wr.on('error', reject)
            wr.on('finish', resolve)
            rd.pipe(wr)
        }).catch(error => {
            rd.destroy()
            wr.end()
            throw error;
        })
    },
    run = () => {
        log("Checking to see if Pianobar is installed...")
        fileExists(pianobarLocalLoc).catch(() => {

            log(`Pianobar is not installed, So let's install it...`)

            log('Checking to see if pkg-config is installed...')
            return commandExists('pkg-config').catch(() => {
                log("pkg-config is not installed, So let's install it...")

                log("Checking to see if Brew is installed...")
                return commandExists('brew').catch(() => {

                    log(`Brew is not installed, So lets install it...`)

                    return installBrew().catch(err('Error installing brew...'))
                }).then(() => {

                    log(`Success!\n So, let's update Brew it and install Pianobar...`)

                    return brew(['update'])
                        .catch(() => err('brew update failed'))
                        .then(() => log("Attempting to install pkg-config"))
                        .then(brew(['install', 'pkg-config']))
                        .then(() => { log("Success!") })
                        .catch(() => err('pkg-config failed to install'))
                })
            }).then(() => {
                log("pkg-config is installed...")

                log("Downloading Pianobar...")
                return downloadPianobar().catch(() => err("Failed to download Pianobar, check internet connection?")).then(() => {
                    log("Compiling Pianobar...")
                    return makePianobar().catch(() => { err("Failed to compile Pianobar...") }).then(() => {
                        log("Pianobar installed successfully!")

                        /*log("Copying Pianobar to proper directory")
                        return copyFile(pianobarExecutableLoc, nodeBinLoc).then(() => { log("Success!") }).catch(() => err('Copy failed...'))*/
                    })
                })

            })
        }).then(() => {
            log("Pianobar is installed!")
            log(`Ensuring directory structure...`)

            return makedirIfNotExists(pianobarConfigPath).then(() => log("Success!")).catch(() => err("Failed..."))
        }).then(() => {
            log(`Attempting to create FIFO...`)
            return mkfifo(ctlPath).catch(() => {}).then(() => {
                log('Success!')
            })
        }).then(() => {
            log("Generating Web UI...")
            return buildUI().then(() => log("Success...")).catch(() => err("Unable to Generate Web UI code"))
        }).then(() => {
            return fileExists(configPath).then(() => inquirer.prompt({
                type: 'confirm',
                default: false,
                name: 'regenConfig',
                message: 'You already have a config file... Do you want to regenerate it?'
            }).then(answer => {
                if (answer.regenConfig) {
                    throw "Regenerate config file"
                }
            })).catch(() => {
                log("Generating Pianobar config file based off of the following questions...")

                const questions = [{
                        type: 'input',
                        name: 'username',
                        message: 'Input your Pandora username to login with (All information is stored locally, only on your computer)'
                    }, {
                        type: 'password',
                        name: 'password',
                        message: 'Input your Pandora password to login with (Stored locally and encrypted on only your computer)'
                    }, {
                        type: 'confirm',
                        default: 'yes',
                        name: 'actuallyAutostart',
                        message: 'Do you want to have pianobar on startup play a specific station you select? (This can be edited later in the UI)'
                    }, {
                        type: 'input',
                        name: 'autostart',
                        default: '814524665525141882',
                        message: `
The autostart station can be found by either:
 1) Running pianobar pressing 's' to change the station to the station you would like to auto start.
 2) Then note the number that shows next to said station.
OR
 1) By going into the web player select the station you would like to autostart
 2) note the numbers at the end of the URL
Input an autostart station for Pandora to automatically play on startup.`,
                        when: ans => ans.actuallyAutostart
                    }],
                    text = ({ username, autostart }) => `
user = ${username}
#password = password
autostart_station = ${autostart||'814524665525141882'}
format_nowplaying_song = [93m%t[0m, by: [93m%a[0m on the album: [96m%l[0m [91m%r[0m%@%s
format_nowplaying_station = Now Playing "[95m%n[0m" [90m(%i)[0m
format_list_song = %i) %a - [92m%t[0m%r
format_msg_info = [97m(i) [0m%s
format_msg_nowplaying = [36m>[0m  %s
format_msg_time = [90m#   [97m%s[0m
format_msg_err = [90m/!\[0m %s
format_msg_question = [97m[?][0m %s
format_msg_debug = [90m%s[0m
password_command = openssl enc -d -aes-256-cbc -in ~/.config/pianobar/pass.enc -pass pass:pianoserver
event_command = ${path.resolve(__dirname,'bin.js')}`,
                    handlePassword = password => {
                        const pianobarConfig = new PianobarConfig({ readLines: false })
                        return pianobarConfig.setPassword(password)
                    }

                return inquirer.prompt(questions).then(answers => {
                    return del(configPath).catch(a => a).then(() => {
                        log("Generating Pianobar config file...")
                        return logToFile(pianobarConfigPath + '/config').log(text(answers))
                    }).then(() => {
                        log("Success!")
                        log("Encrypting Password...")
                        return handlePassword(answers.password).then(() => log("Success!")).catch(() => err('Failed To Encrypt password, try installing openssl?'))

                    })
                })
            })
        }).then(() => {
            log("Installing Launcher...")

            return serverCommands.startLauncher().then(() => log("Success!")).catch(() => log("Unable to install Launcher"))
        }).then(() =>
            inquirer.prompt({
                type: 'confirm',
                name: 'launch',
                message: 'Would you like to start Pianoserver now?',
                default: false
            }).then(answer => {
                if (answer.launch) {
                    throw 'launch'
                }
            }).catch(() => {
                return serverCommands.startServer()
            }).then(() => log("Server has been launched you can connect to the CLI interface by running 'pianoserver'")).catch(() => log("Unable to start server maybe something didn't install correctly")))
    }
if (!module.parent) {
    run()
}
module.exports = run