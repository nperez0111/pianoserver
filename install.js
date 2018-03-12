const commandExists = require('command-exists'),
    execa = require('execa'),
    log = console.log.bind(console),
    brew = execa.bind(execa, 'brew'),
    mkfifo = execa.bind(execa, 'mkfifo'),
    installBrew = () => execa('/usr/bin/ruby', ['-e', '"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"']),
    homedir = require('homedir')(),
    path = require('path'),
    fs = require('fs'),
    del = require('del'),
    inquirer = require('inquirer'),
    logToFile = (file) => {
        const log_file = fs.createWriteStream(file, { flags: 'w' })
        return {
            log: function(line) {
                log_file.write(util.format(line));
            },
            logLine: function(line) {
                log_file.write(util.format(line) + '\n');
            },
            newLine: function() {
                log_file.write('\n')
            },
            makeExecutable: function(cb) {
                fs.chmod(file, 0755, cb)
            }
        }
    },
    err = console.error.bind(console),
    PianobarConfig = require('./pianobarConfig'),
    pianobarConfigPath = path.resolve(homedir, '.config/pianobar'),
    configPath = path.resolve(pianobarConfigPath, 'config'),
    ctlPath = path.resolve(pianobarConfigPath, 'ctl'),
    //config = require('./config'),
    makedirIfNotExists = path => execa('mkdir', ['-p', path]),
    run = () => {
        log("Checking to see if Pianobar is installed...")
        commandExists('pianobar').catch(() => {

            log(`Pianobar is not installed, So let's install it...`)
            log("Checking to see if Brew is installed...")
            commandExists('brew').catch(() => {

                log(`Brew is not installed, So lets install it...`)

                return installBrew().catch(err('Error installing brew...'))
            }).then(() => {

                log(`Success!\n So, let's update Brew it and install Pianobar...`)

                return brew(['update'])
                    .catch(err('brew update failed'))
                    .then(() => log("Attempting to install Pianobar"))
                    .then(brew(['install', 'pianobar']))
                    .then(() => { log("Success!") })
                    .catch(err('Pianobar failed to install'))
            })
        }).then(() => {
            //pianobar exists
            log(`Ensuring directory structure...`)

            return makedirIfNotExists(path).then(() => log("Success!")).catch(err("Failed..."))
        }).then(() => {
            log(`Attempting to create FIFO...`)
            return mkfifo(ctlPath)
                .catch(a => {
                    log("FIFO is probably already there...")
                }).then(() => {
                    log('Success!')
                })
        }).then(() => {
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
#password = ${password}
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
event_command = ~/.config/pianobar/pianobarNotify.rb`,
                handlePassword = password => {
                    const pianobarConfig = new PianobarConfig({ readLines: false })
                    return pianobarConfig.setPassword(password)
                }

            return inquirer.prompt(questions).then(answers => {
                return del(configPath).catch(a => a).then(() => {
                    log("Generating Pianobar config file...")
                    return logToFile(path + '/config').log(text(answers))
                }).then(() => {
                    log("Success!")
                    log("Encrypting Password...")
                    return handlePassword(answers.password).then(() => log("Success!")).catch(err('Failed To Encrypt password, try installing openssl?'))

                })
            })
        })
    }
if (!module.parent) {
    run()
}
module.exports = run