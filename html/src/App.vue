<template>
  <v-app dark id="inspire">
    <v-navigation-drawer fixed clipped v-model="drawer" app>
      <v-list dense>
        <v-subheader class="mt-3 grey--text">STATIONS ({{stations.length}})</v-subheader>
        <v-list-tile class="mt-3" @click="shuffle">
          <v-list-tile-action>
            <v-icon color="grey">shuffle</v-icon>
          </v-list-tile-action>
          <v-list-tile-title class="grey--text">QuickMix</v-list-tile-title>
        </v-list-tile>
        <v-list dense>
          <v-list-tile v-for="(item,i) in stations" :key="i" @click="changeStationTo(i)" avatar>
            <v-list-tile-avatar>
                <img :src="albumCovers[i]||'https://lh3.googleusercontent.com/PPRgtbBG6Blerg-13m_RbAiQyTcrVIalJVkafFEaNLf0HZu-FVNPs14AJb-IuDtQqQ=rw'">
              </v-list-tile-avatar>
            <v-list-tile-title v-text="item"></v-list-tile-title>
          </v-list-tile>
        </v-list>
        
        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon color="grey darken-1">settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-title class="grey--text text--darken-1">Manage Subscriptions</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar color="primary" dense fixed clipped-left app>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-icon class="mx-3">fa-youtube</v-icon>
      <v-toolbar-title class="mr-5 align-center">
        <span class="title" v-text="currentStation">Pianobar</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <v-content>
      <router-view v-on:hideoverflow="hideOverflow" v-on:showoverflow="showOverflow"/>
    </v-content>

    <v-dialog
        v-model="prompt"
        fullscreen
        transition="dialog-bottom-transition"
        :overlay="false"
        scrollable
      >
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
                  This computer
                </v-btn>
                <v-btn @click="chosen=true">
                  Another Computer <v-icon right>arrow_forward</v-icon>
                </v-btn>
              </v-layout>
              <v-layout row class="mt-5" v-show="chosen">
                <v-text-field v-model="url" :error="error"></v-text-field><v-btn @click="tryReconnect">Try reconnect</v-btn>
              </v-layout>
              <v-layout row class="mt-5" v-show="enterPort&&!chosen">
                <v-text-field v-model="port" type="number" :error="error"></v-text-field><v-btn @click="tryReconnect('ws://localhost:'+port)">Try reconnect</v-btn>
              </v-layout>
              <v-layout row justify-center>
                <v-progress-circular indeterminate :size="70" :width="7" color="light-blue" v-if="loading"></v-progress-circular>
              </v-layout>
            </v-container>
          </v-card-text>

          <div style="flex: 1 1 auto;"/>
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
    this.$station.onchangeStations(stations=>{
      if(!this.loadedAlbumCovers){
        window.LastFM=LastFM
        LastFM.getImagesForStations(stations).then(images=>{
          this.albumCovers=images
        })
      }
      this.stations = stations
    })
    this.$station.onchangeStation(stationName=>{
      this.currentStation = stationName
    })
    const url='wss://pandora.localtunnel.me',
    port=8081,
    choice = ls.get('socket') || (window.location.hostname==='localhost'?'ws://localhost:'+port:url)

    window.socket = this.$socket.init(choice)
    setTimeout(()=>{
      if(socket.disconnected===true){
        socket.disconnect()
        this.prompt=true
      }else{
        ls.set('socket',choice)
      }
    },1000)
    window.App=this
    return {
      loading:false,
      enterPort:false,
      error:false,
      prompt:false,
      chosen:false,
      loadedAlbumCovers:false,
      drawer: true,
      showBottomPlayer:false,
      albumCovers:[],
      stations:this.$station.getStations(),
      currentStation:this.$station.getStation(),
      port,
      url:choice
    }
  },
  props: {
    source: String
  },
  methods:{
    setStations(stations){
      this.stations=stations
    },
    shuffle(){
      this.$socket.emit('shuffle')
    },
    changeStationTo(index){
      this.$socket.emit('selectStation',index)
    },
    hideOverflow(){
      document.getElementsByTagName('html')[0].style.overflow='hidden'
    },
    showOverflow(){
      document.getElementsByTagName('html')[0].style.overflow='auto'
    },
    tryReconnect(url){
      this.loading=true
      window.socket=this.$socket.init(typeof url==='string'?url:this.url)
      setTimeout(()=>{
      if(socket.connected===true){
        this.prompt=false
        this.error=false
        player.socketSetup()
        ls.set('socket',this.url)
      }else{
        socket.disconnect()
        this.error=true
      }
      this.loading=false
    },1000)
    }
  }
}
</script>
<style>
 .input-group__details:after {
  background-color: rgba(255, 255, 255, 0.32) !important;
 }
</style>
