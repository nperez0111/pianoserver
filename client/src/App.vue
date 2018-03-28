<template>
    <v-app dark id="inspire">
        <v-navigation-drawer fixed clipped v-model="drawer" app>
            <v-list dense>
                <v-list-tile @click="$socket.emit('quitPianobar')" class="mt-2">
                    <v-list-tile-action>
                        <v-icon color="grey lighten-2">close</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title class="grey--text text--lighten-2">Quit Server</v-list-tile-title>
                </v-list-tile>
                <v-list-tile @click="restartServer" class="mt-2">
                    <v-list-tile-action>
                        <v-icon color="grey lighten-2">restore</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title class="grey--text text--lighten-2">Restart Server</v-list-tile-title>
                </v-list-tile>
                <v-list-tile @click="toSettings" class="mt-2">
                    <v-list-tile-action>
                        <v-icon color="grey lighten-2">settings</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title class="grey--text text--lighten-2">Settings</v-list-tile-title>
                </v-list-tile>
                <v-subheader class="grey--text">STATIONS ({{stations.length}})</v-subheader>
                <v-list-tile class="my-1" @click="shuffle">
                    <v-list-tile-action>
                        <v-icon large>shuffle</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title>QuickMix</v-list-tile-title>
                </v-list-tile>
                <v-list dense>
                    <v-list-tile v-for="(item,i) in stations" :key="i" @click="changeStationTo(i)" avatar>
                        <v-list-tile-avatar>
                            <img :src="albumCovers[i]" v-if="albumCovers[i]">
                            <v-icon large v-else>music_note</v-icon>
                        </v-list-tile-avatar>
                        <v-list-tile-content>
                            <v-list-tile-title v-text="item"></v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action class="tile-action">
                            <v-btn icon ripple @click.stop="stationSettings(i)">
                                <v-icon color="grey lighten-1">settings</v-icon>
                            </v-btn>
                        </v-list-tile-action>
                    </v-list-tile>
                </v-list>
            </v-list>
        </v-navigation-drawer>
        <v-toolbar color="primary" dense fixed clipped-left app v-if="toolbar">
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title>
                <router-link to="/">
                    <span class="title white--text" v-text="currentStation">Pianobar</span>
                </router-link>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="$socket.emit('getCurrentStatus')" v-if="showRefresh">
                <v-icon>refresh</v-icon>
            </v-btn>
        </v-toolbar>
        <v-content>
            <router-view v-on:hideoverflow="hideOverflow" v-on:showoverflow="showOverflow" v-on:edit="edit" />
        </v-content>
        <v-dialog v-model="disconnected" fullscreen transition="dialog-bottom-transition" :overlay="false" scrollable>
            <v-card tile>
                <v-toolbar card dark color="primary">
                    <v-toolbar-title v-if="hasWorkedBefore===false">Welcome to Pianoserver</v-toolbar-title>
                    <v-toolbar-title v-if="hasWorkedBefore!==false">Reconnect to Pianoserver</v-toolbar-title>
                    <v-spacer></v-spacer>
                </v-toolbar>
                <v-card-text>
                    <v-slide-y-transition>
                        <Full-Height v-if="hasWorkedBefore===false">
                            <h1 class="display-2 text-xs-center">Welcome to the Pianoserver UI</h1>
                            <h2 class="headline text-xs-center my-2">Here's how to get started</h2>
                            <v-expansion-panel popout>
                                <v-expansion-panel-content>
                                    <div slot="header">Install Pianoserver</div>
                                    <v-card>
                                        <v-card-text>
                                            To install Pianoserver run <code>$ npm install nperez0111/pianoserver</code> in your terminal.
                                        </v-card-text>
                                    </v-card>
                                </v-expansion-panel-content>
                                <v-expansion-panel-content>
                                    <div slot="header">Run Pianoserver</div>
                                    <v-card>
                                        <v-card-text>
                                            To run Pianoserver run <code>$ pianoserver</code> in your terminal.
                                        </v-card-text>
                                    </v-card>
                                </v-expansion-panel-content>
                                <v-expansion-panel-content>
                                    <div slot="header">Connect the UI to the server</div>
                                    <v-card>
                                        <v-card-text>
                                            In order for you to be able to control the server from this UI we have to let the UI know where the server is, when the server is started it gives you two URLs to use, the first is an external URL that can be used from anywhere and the second can only be used on your local machine where the music is playing out of. The UI below allows you to specify which you would like to connect to.
                                        </v-card-text>
                                        <v-card-actions>
                                            <v-btn @click="hasWorkedBefore=0">
                                                Connect to Server
                                            </v-btn>
                                        </v-card-actions>
                                    </v-card>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                        </Full-Height>
                    </v-slide-y-transition>
                    <v-slide-y-transition>
                        <v-container v-show="hasWorkedBefore!==false">
                            <h1 class="display-1 text-xs-center">We noticed you've connected before, let's try to get you connected once more</h1>
                            <v-layout wrap class="ma-4" justify-center align-center>
                                <v-card class="flex xs12 md6 xl4 pa-3 layout justify-center align-center column my-3" height="150">
                                    <v-tooltip top>
                                        <h2 slot="activator">If the Server is running:</h2>
                                        <span>You can check if the server is running by running the command: <code>$ pianoserver status</code></span>
                                    </v-tooltip>
                                    <v-btn @click="tryReconnect" color="green" :loading="connectionState==='loading'" :disabled="connectionState==='loading'">Try reconnect
                                        <v-icon right>refresh</v-icon>
                                        <span slot="loader">Trying to Connect...</span>
                                    </v-btn>
                                </v-card>
                                <v-card class="flex xs12 md6 xl4 pa-3 layout justify-center align-center column my-3" height="150">
                                    <v-tooltip top>
                                        <h2 slot="activator">If the Server is not running:</h2>
                                        <span>You can check if the server is running by running the command: <code>$ pianoserver status</code></span>
                                    </v-tooltip>
                                    <p>You'll need to start the server by running the command: <code>$ pianoserver</code></p>
                                </v-card>
                                <v-card class="flex xs12 md6 xl4 pa-3 layout justify-center align-center column my-3" height="150">
                                    <h2>If trying to reconnect didn't work:</h2>
                                    <p>This is most likely because '{{url}}' is not pointing to the server.</p>
                                    <v-btn @click="hasWorkedBefore=0" color="primary">
                                        <v-icon left>edit</v-icon>Edit URL
                                    </v-btn>
                                </v-card>
                            </v-layout>
                        </v-container>
                    </v-slide-y-transition>
                    <v-slide-y-transition>
                        <v-container v-show="disconnected && !hasWorkedBefore" class="mb-5 pb-5">
                            <h1 class="display-1 text-xs-center">We need to know what you are trying to play from</h1>
                            <v-layout row justify-center class="mt-5">
                                <v-btn @click="location='local',url='ws://localhost:'+port" color="primary">
                                    This Computer
                                    <v-icon right>computer</v-icon>
                                </v-btn>
                                <v-btn @click="location='external'" color="primary">
                                    Another Computer
                                    <v-icon right>settings_ethernet</v-icon>
                                </v-btn>
                            </v-layout>
                            <v-layout row class="mt-5" v-show="location!==undefined">
                                <v-flex xs12 lg8>
                                    <v-text-field v-model="url" :error="connectionState==='disconnected'" @keyup.enter="tryReconnect"></v-text-field>
                                </v-flex>
                                <v-layout class="flex xs12 lg4" justify-center align-center>
                                    <v-btn @click="tryReconnect" color="green" :loading="connectionState==='loading'" :disabled="connectionState==='loading'">Try reconnect
                                        <v-icon right>refresh</v-icon>
                                        <span slot="loader">Trying to Connect...</span>
                                    </v-btn>
                                </v-layout>
                            </v-layout>
                        </v-container>
                    </v-slide-y-transition>
                </v-card-text>
                <div style="flex: 1 1 auto;"></div>
            </v-card>
        </v-dialog>
        <v-snackbar color="error" v-model="disconnected" :timeout="hasWorkedBefore?100000:1" vertical>
            Whoops seems like we can't connect to your Pandora, check to see that the url is correct and that you have the server running
            <v-btn dark flat @click.native="connectionState='loading'">Close</v-btn>
        </v-snackbar>
        <v-snackbar color="error" v-model="failedToRestart" :timeout="100000" vertical>
            Whelp something went wrong and the server failed to restart, your best bet is just to quit the server.
            <v-btn dark flat @click.native="">Close</v-btn>
        </v-snackbar>
    </v-app>
</template>
<script>
import LastFM from '@/lib/LastFM'
import * as ls from 'local-storage'
import FullHeight from '@/components/Full-Height'

function isLocalIP(str) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)
}
export default {
    components: {
        'Full-Height': FullHeight
    },
    data: function() {
        this.$station.onchangeStations(stations => {
            if (!this.loadedAlbumCovers) {
                window.LastFM = LastFM
                LastFM.getImagesForStations(stations).then(images => {
                    this.albumCovers = images
                })
            }
            this.stations = stations
        })
        this.$station.onchangeStation(stationName => {
            this.currentStation = stationName
        })
        const url = window.location.hostname === 'localtunnel' ? `wss://${window.location.href.slice(5,-3)}` : 'wss://pandora.localtunnel.me',
            port = 8081,
            choice = ls.get('socket') || (window.location.hostname === 'localhost' ? 'ws://localhost:' + port : isLocalIP(window.location.hostname) ? `ws://${window.location.hostname}:${port}` : url)
        console.log(choice)
            //try to reconnect to past connect or defaults
            //figure out issue with localtunnel not updating but localhost does, work on url parsing 
        this.tryReconnect(choice, this.infiniteHandler)

        window.App = this
        return {
            connectionState: 'disconnected',
            retryAmount: 3,
            location: undefined,
            loadedAlbumCovers: false,
            drawer: false,
            albumCovers: [],
            stations: this.$station.getStations(),
            currentStation: this.$station.getStation(),
            port,
            url: choice,
            popularStations: ls.get('pastStations') || {},
            toolbar: true,
            showRefresh: ls.get('showRefresh') || false,
            restartStatus: false,
            hasWorkedBefore: ls.get('socket') ? true : false,
        }
    },
    props: {
        source: String
    },
    computed: {
        disconnected: {
            get() {
                return this.connectionState === 'disconnected' || this.connectionState === 'loading'
            },
            set() {}
        },
        failedToRestart: {
            get() {
                return this.restartStatus === 'failed'
            },
            set() {}
        },
        isRestarting: {
            get() {
                return this.restartStatus === 'restarting'
            },
            set() {}
        }
    },
    methods: {
        edit(key, value) {
            this[key] = value
        },
        setStations(stations) {
            this.stations = stations
        },
        shuffle() {
            this.$socket.emit('shuffle')
        },
        stationSettings(index) {
            this.drawer = false
            this.$router.push(`/station-settings/${index}`)
                /*
                +    love song
                -    ban song
                a    add music to station
                c    create new station
                d    delete station
                e    explain why this song is played
                g    add genre station
                h    song history
                */
        },
        toSettings() {
            this.drawer = false
            this.$router.push('/settings')
        },
        changeStationTo(index) {
            this.$socket.emit('selectStation', index)
            const s = this.popularStations[this.stations[index]]
            if (s) {
                this.popularStations[this.stations[index]] += 1
            } else {
                this.popularStations[this.stations[index]] = 1
            }
            ls.set('pastStations', this.popularStations)
        },
        hideOverflow() {
            document.getElementsByTagName('html')[0].style.overflow = 'hidden'
        },
        showOverflow() {
            document.getElementsByTagName('html')[0].style.overflow = 'auto'
        },
        infiniteHandler(socket) {
            if (socket.disconnected) {
                this.$socket.count++
                    socket.disconnect()
                setTimeout(this.tryReconnect.bind(this, this.url, (this.$socket.count < this.retryAmount) ? this.infiniteHandler : false), 500)
            } else {
                ls.set('socket', this.url)
                this.connectionState = 'connected'
            }
        },
        tryReconnect(url, handler = false) {
            this.connectionState = 'loading'
            const socket = this.$socket.init(typeof url === 'string' ? url : this.url),
                socketUsers = [this.$config, this.$station, this.$player],
                socketHandler = (handler || (socket => {
                    if (socket.connected === true) {
                        this.connectionState = 'connected'
                        ls.set('socket', this.url)
                    } else {
                        socket.disconnect()
                        this.connectionState = 'disconnected'
                    }
                }))
            window.socket = socket
            socketUsers.forEach(socketUser => {
                socketUser.init(socket)
            })
            return setTimeout(socketHandler.bind(this, socket), 1000)
        },
        restartServer() {
            this.$socket.on('restartPianobar', (restarted) => {
                if (restarted) {
                    //cool just wait to reconnect
                    this.restartStatus = 'success'
                    this.$socket.count = -1
                    this.tryReconnect(this.url, this.infiniteHandler)
                } else {
                    // throw an error message
                    this.restartStatus = 'failed'
                }
            })
            this.restartStatus = 'restarting'
            this.$socket.emit('restartPianobar')
        }
    }
}
</script>
<style>
.input-group__details:after {
    background-color: rgba(255, 255, 255, 0.32) !important;
}

.tile-action {
    min-width: 32px;
}
</style>
