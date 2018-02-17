<template>
  <v-container fluid>
    <v-slide-y-transition mode="out-in">
      <v-layout column align-center>
        <img :src="status.coverArt" alt="Album Cover" class="mb-5">
        <h2>{{status.title}} by {{status.artist}}</h2>
        <v-subheader>on {{status.album}}</v-subheader>
        <v-flex xs12>
          <v-layout row align-center>
            <v-layout column>
              <v-btn icon fab large slot="activator" @click="likeSong">
                <v-icon>thumb_up</v-icon>
              </v-btn>
              <v-btn icon fab large slot="activator" @click="dislikeSong" :class="{light:!disliked,red:disliked}">
                <v-icon>thumb_down</v-icon>
              </v-btn>
            </v-layout>
            
            <v-progress-circular :size="250" :width="15" :rotate="180" v-model="percentage" color="pink">
              <v-btn icon fab large @click="play" v-if="!paused">
                <v-icon>play_arrow</v-icon>
              </v-btn>
              <v-btn icon fab large @click="pause" v-else>
                <v-icon>pause</v-icon>
              </v-btn>
            </v-progress-circular>

            <v-btn icon fab large>
              <v-icon>fast_forward</v-icon>
            </v-btn>
      </v-layout></v-flex>
        
      </v-layout>
    </v-slide-y-transition>
  </v-container>
</template>
<script>
import io from 'socket.io-client'
window.io=io
  export default{
  mounted(){
    this.socket=io('ws://localhost:8081')
    this.socket.on("status",this.onStatus.bind(this))
    this.socket.on("currentTime",this.onCurrentTime.bind(this))
    this.socket.on("isPlaying",this.isPlaying.bind(this))
    this.socket.on("getCurrentStatus",([statuses,isPlaying])=>{
      const state = statuses.some(status=>{
        if(status && parseInt(status.stationCount) > 0 && status.coverArt){
          this.stations = this.getStations(status)
          this.$station.setStations(this.stations)
          this.$station.setStation(status.songStationName)
          this.status=status
          this.setUpSong(status)
          this.isPlaying(isPlaying)
          return true
        }
      })

      if(this.stations===null){
        setTimeout(()=>{
          this.socket.emit("getCurrentStatus",10)
        },1000)
      }
      
    })
    this.socket.emit("getCurrentStatus",4)
    window.socket=this.socket
    window.player=this
  },
  data(){
    this.$station.onchangeStation(station=>{
      this.station=station
    })
    return {
      socket:null,
      status:{},
      liked:false,
      disliked:false,
      loadingNextSong:false,
      currentTime:{now:"0:0",ofTotal:"0:0"},
      stations:this.$station.getStations(),
      station:this.$station.getStation(),
      paused:false
    }
  },
  methods:{
    setUpSong(status){
      this.liked=status.rating==='1'
      this.disliked=false
      this.loadingNextSong=false
    },
    onStatus(status){
      this.status=status
      console.log(status)
    },
    onCurrentTime(time){
      this.currentTime=time
    },
    getStations(state){
      const amount=state.stationCount
      if(amount){
        return (new Array(parseInt(amount))).fill(false).map((c,i)=>state[`station${i}`])
      }
      return null
    },
    play(){
      this.paused=false
      this.socket.emit("play",this.status,this.currentTime)
    },
    pause(){
      this.paused=true
      this.socket.emit("pause",this.status,this.currentTime)
    },
    likeSong(){
      this.liked=true
      this.socket.emit("likeSong",this.status,this.currentTime)
    },
    dislikeSong(){
      this.disliked=true
      this.socket.emit("dislikeSong",this.status,this.currentTime)
    },
    nextSong(){
      this.loadingNextSong=true
      this.socket.emit("nextSong",this.status,this.currentTime)
    },
    isPlaying(playing){
      console.log('set paused to',!playing)
      this.paused=!playing
    }
  },
  computed:{
    percentage(){
      if(this.currentTime.now==null){
        return 0
      }
      const nowSeconds= parseInt(this.currentTime.now.split(":")[0]) * 60 + parseInt(this.currentTime.now.split(":")[1]),
            totalSeconds= parseInt(this.currentTime.ofTotal.split(":")[0]) * 60 + parseInt(this.currentTime.ofTotal.split(":")[1])
      return (1-(nowSeconds / totalSeconds)) * 100
    }
  }
  }
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
