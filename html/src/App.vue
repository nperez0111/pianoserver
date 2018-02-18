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
      <router-view/>
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
                <v-btn @click="sayError">
                  This computer
                </v-btn>
                <v-btn @click="chosen=true">
                  Another Computer <v-icon right>arrow_forward</v-icon>
                </v-btn>
              </v-layout>
              <v-layout row class="mt-5" v-show="chosen">
                <v-text-field v-model="url"></v-text-field>
              </v-layout>
            </v-container>
          </v-card-text>

          <div style="flex: 1 1 auto;"/>
        </v-card>
      </v-dialog>

  </v-app>
</template>
<script>
import LastFM from '@/lib/LastFM'
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
    const url='ws://pkzjiayypn.localtunnel.me'
    window.socket = this.$socket.init('ws://localhost:8081')
    setTimeout(()=>{
      if(socket.disconnected===true){
        socket.disconnect()
        this.prompt=true
      }
    },500)
    window.App=this
    return {
      error:false,
      prompt:false,
      chosen:false,
      loadedAlbumCovers:false,
      drawer: true,
      showBottomPlayer:false,
      albumCovers:[],
      stations:this.$station.getStations(),
      currentStation:this.$station.getStation(),
      url:url
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
    sayError(){
      

    }
  }
}
</script>
<style>
 .input-group__details:after {
  background-color: rgba(255, 255, 255, 0.32) !important;
 }
</style>
