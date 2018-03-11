<template>
  <v-app dark id="inspire">
    <v-navigation-drawer fixed clipped v-model="drawer" app>
      <v-list dense>
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
    <v-dialog v-show="connectionState==='disconnected'" fullscreen transition="dialog-bottom-transition" :overlay="false" scrollable>
      <v-card tile>
        <v-toolbar card dark color="primary">
          <v-toolbar-title>Welcome to Pianobar</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
          <v-container>
            <h1 class="text-xs-center">We need to know what you are trying to play from</h1>
            <v-layout row justify-center class="mt-5">
              <v-btn @click="location='local',url='ws://localhost:'+port">
                This Computer
              </v-btn>
              <v-btn @click="location='external'">
                Another Computer
                <v-icon right>arrow_forward</v-icon>
              </v-btn>
            </v-layout>
            <v-layout row class="mt-5" v-show="location!==undefined">
              <v-flex xs12 lg8>
                <v-text-field v-model="url" :error="connectionState==='disconnected'" @keyup.enter="tryReconnect"></v-text-field>
              </v-flex>
              <v-flex xs12 lg4>
                <v-btn @click="tryReconnect">Try reconnect</v-btn>
              </v-flex>
            </v-layout>
            <v-layout row justify-center>
              <v-progress-circular indeterminate :size="70" :width="7" color="light-blue" v-if="loading"></v-progress-circular>
            </v-layout>
          </v-container>
        </v-card-text>
        <div style="flex: 1 1 auto;" />
      </v-card>
    </v-dialog>
    <v-snackbar color="error" v-show="connectionState==='disconnected'" :timeout="10000" vertical>
      Whoops seems like we can't connect to your pandora, check to see that the url is correct and that you have the server running
      <v-btn dark flat @click.native="connectionState='loading'">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>
<script>
import LastFM from '@/lib/LastFM'
import * as ls from 'local-storage'
function isLocalIP(str){
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)
}
export default {
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
    const url = window.location.hostname === 'localtunnel'?`wss://${window.location.href.slice(5,-3)}`:'wss://pandora.localtunnel.me',
      port = 8081,
      choice = ls.get('socket') || (window.location.hostname === 'localhost' ? 'ws://localhost:' + port : isLocalIP(window.location.hostname)? `ws://${window.location.hostname}:${port}` : url)
console.log(choice)
    //try to reconnect to past connect or defaults
    //figure out issue with localtunnel not updating but localhost does, work on url parsing 
    this.tryReconnect(choice,this.infiniteHandler)

    window.App = this
    return {
      connectionState:'loading',
      retryAmount:10,
      loading: false,
      location:undefined,
      loadedAlbumCovers: false,
      drawer: false,
      albumCovers: [],
      stations: this.$station.getStations(),
      currentStation: this.$station.getStation(),
      port,
      url: choice,
      popularStations: ls.get('pastStations') || {},
      toolbar: true,
      showRefresh:ls.get('showRefresh')||false
    }
  },
  props: {
    source: String
  },
  methods: {
    edit(key,value){
      this[key]=value
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
    infiniteHandler(socket){
      if(socket.disconnected){
        this.$socket.count++
        socket.disconnect()
        setTimeout(this.tryReconnect.bind(this,this.url,(this.$socket.count<this.retryAmount)?this.infiniteHandler:false),500)
      }
    },
    tryReconnect(url,handler=false) {
      this.connectionState='loading'
      const socket = this.$socket.init(typeof url === 'string' ? url : this.url),
        socketUsers = [this.$config, this.$station, this.$player],
        socketHandler = ( handler || ( socket => {
        if (socket.connected === true) {
          this.connectionState='connected'
          ls.set('socket', this.url)
        } else {
          socket.disconnect()
          this.connectionState='disconnected'
        }
        this.loading = false
      }))
      window.socket = socket
      socketUsers.forEach(socketUser => {
        socketUser.init(socket)
      })
      return setTimeout(socketHandler.bind(this,socket), 1000)
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
