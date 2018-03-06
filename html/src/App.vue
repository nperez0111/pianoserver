<template>
  <v-app dark id="inspire">
    <v-navigation-drawer fixed clipped v-model="drawer" app>
      <v-list dense>
        <v-list-tile @click="toSettings" class="mt-2">
          <v-list-tile-action>
            <v-icon color="grey lighten-2">settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-title class="grey--text text--lighten-2">Manage Settings</v-list-tile-title>
        </v-list-tile>
        <v-subheader class="grey--text"><span class="mx-auto">STATIONS ({{stations.length}})</span></v-subheader>
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
      <v-btn icon @click="refresh">
        <v-icon>refresh</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <router-view v-on:hideoverflow="hideOverflow" v-on:showoverflow="showOverflow" v-on:hideToolbar="hideToolbar" v-on:showToolbar="showToolbar" />
    </v-content>
    <v-dialog v-model="prompt" fullscreen transition="dialog-bottom-transition" :overlay="false" scrollable>
      <v-card tile>
        <v-toolbar card dark color="primary">
          <v-toolbar-title>Welcome to Pianobar</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card-text>
          <v-container>
            <h1 class="text-xs-center">We need to know what you are trying to play from</h1>
            <v-layout row justify-center class="mt-5" v-show="!chosen">
              <v-btn @click="enterPort=true">
                This Computer
              </v-btn>
              <v-btn @click="chosen=true">
                Another Computer
                <v-icon right>arrow_forward</v-icon>
              </v-btn>
            </v-layout>
            <v-layout row class="mt-5" v-show="chosen">
              <v-text-field v-model="url" :error="error"></v-text-field>
              <v-btn @click="tryReconnect">Try reconnect</v-btn>
            </v-layout>
            <v-layout row class="mt-5" v-show="enterPort&&!chosen">
              <v-text-field v-model="port" type="number" :error="error"></v-text-field>
              <v-btn @click="tryReconnect('ws://localhost:'+port)">Try reconnect</v-btn>
            </v-layout>
            <v-layout row justify-center>
              <v-progress-circular indeterminate :size="70" :width="7" color="light-blue" v-if="loading"></v-progress-circular>
            </v-layout>
          </v-container>
        </v-card-text>
        <div style="flex: 1 1 auto;" />
      </v-card>
    </v-dialog>
    <v-snackbar color="error" v-model="error" :timeout="10000" vertical>
      Whoops seems like we can't connect to your pandora, check to see that the url is correct and that you have the server running
      <v-btn dark flat @click.native="error = false">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>
<script>
import LastFM from '@/lib/LastFM'
import * as ls from 'local-storage'
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
    const url = 'wss://pandora.localtunnel.me',
      port = 8081,
      choice = ls.get('socket') || (window.location.hostname === 'localhost' ? 'ws://localhost:' + port : url)

    //try to reconnect to past connect or defaults
    this.tryReconnect(choice)

    window.App = this
    return {
      loading: false,
      enterPort: false,
      error: false,
      prompt: false,
      chosen: false,
      loadedAlbumCovers: false,
      drawer: false,
      showBottomPlayer: false,
      albumCovers: [],
      stations: this.$station.getStations(),
      currentStation: this.$station.getStation(),
      port,
      url: choice,
      popularStations: ls.get('pastStations') || {},
      toolbar: true
    }
  },
  props: {
    source: String
  },
  methods: {
    hideToolbar() {
      this.toolbar = false
    },
    showToolbar() {
      this.toolbar = true
    },
    setStations(stations) {
      this.stations = stations
    },
    shuffle() {
      this.$socket.emit('shuffle')
    },
    stationSettings(index) {
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
    refresh() {
      this.$socket.emit('getCurrentStatus')
    },
    tryReconnect(url) {
      this.loading = true
      const socket = this.$socket.init(typeof url === 'string' ? url : this.url)
      window.socket = socket
      this.$player.init(socket, this.$station)
      this.$config.init(socket)
      setTimeout(() => {
        if (socket.connected === true) {
          this.prompt = false
          this.error = false
          ls.set('socket', this.url)
        } else {
          socket.disconnect()
          this.error = true
          this.prompt = true
        }
        this.loading = false
      }, 1000)
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
