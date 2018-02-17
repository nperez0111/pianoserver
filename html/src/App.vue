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
        <span class="title" v-text="currentStation">Pandora</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <v-content>
      <router-view/>
    </v-content>
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
    window.App=this
    return {
      loadedAlbumCovers:false,
      drawer: true,
      showBottomPlayer:false,
      albumCovers:[],
      stations:this.$station.getStations(),
      currentStation:this.$station.getStation()
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
    }
  }
}
</script>
<style>
 .input-group__details:after {
  background-color: rgba(255, 255, 255, 0.32) !important;
 }
</style>
