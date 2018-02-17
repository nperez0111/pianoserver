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
              <v-btn icon fab large flat slot="activator" @click="likeSong" v-if="liked" color="blue lighten-2">
                <v-icon>thumb_up</v-icon>
              </v-btn>
              <v-btn icon fab large flat slot="activator" @click="likeSong" v-else>
                <v-icon>thumb_up</v-icon>
              </v-btn>
              <v-btn icon fab large flat slot="activator" @click="dislikeSong" color="red lighten-2">
                <v-icon>thumb_down</v-icon>
              </v-btn>
            </v-layout>
            
            <v-progress-circular :size="250" :width="15" :rotate="180" v-model="percentage" color="primary">
              <v-btn icon fab large @click="play" v-if="!playing">
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

  export default{
  mounted(){
    window.player = this

    //server emitted events
    this.$socket.on("status", this.onStatus.bind(this))
    this.$socket.on("currentTime", this.onCurrentTime.bind(this))
    this.$socket.on("isPlaying", this.isPlaying.bind(this))

    //try to initialize with some values
    this.$socket.on("getCurrentStatus", ([statuses, isPlaying]) => {
      const state = statuses.some(status => {
        if (status && parseInt(status.stationCount) > 0 && status.coverArt) {
          this.stations = this.getStations(status)
          this.$station.setStations(this.stations)
          this.$station.setStation(status.stationName)
          if(typeof status == 'string'){
            this.status = JSON.parse(status)
          }else{
            this.status = status
          }
          this.setUpSong(status)
          this.isPlaying(isPlaying)
          return true
        }
      })

      if (this.stations === null) {
        setTimeout(() => {
          this.$socket.emit("getCurrentStatus", 10)
        }, 1000)
      }

    })

    //trigger initialize
    this.$socket.emit("getCurrentStatus", 6)
  },
  data(){
    this.$station.onchangeStation(station=>{
      this.station=station
    })
    return {
      status:{},
      liked:false,
      disliked:false,
      loadingNextSong:false,
      currentTime:{now:null,ofTotal:null},
      stations:this.$station.getStations(),
      station:this.$station.getStation(),
      playing:true
    }
  },
  methods:{
    setUpSong(status){
      this.liked = status.rating==='1'
      this.disliked = false
      this.loadingNextSong = false
    },
    onStatus(status){

      
      if(typeof status == 'string'){
        this.status = JSON.parse(status)
      }else{
        this.status = status
      }
      this.$station.setStations(this.stations)
      this.$station.setStation(status.stationName)
      this.setUpSong(status)
      //console.log(status)
    },
    onCurrentTime(time,isPlaying){
      this.currentTime = time
      this.isPlaying(isPlaying)
    },
    getStations(state){
      const amount=state.stationCount
      if(amount){
        return (new Array(parseInt(amount))).fill(false).map((c,i)=>state[`station${i}`])
      }
      return null
    },
    play(){
      this.playing=true
      this.$socket.emit("play",this.status,this.currentTime)
    },
    pause(){
      this.playing=false
      this.$socket.emit("pause",this.status,this.currentTime)
    },
    likeSong(){
      this.liked=true
      this.$socket.emit("likeSong",this.status,this.currentTime)
    },
    dislikeSong(){
      this.disliked=true
      this.$socket.emit("dislikeSong",this.status,this.currentTime)
    },
    nextSong(){
      this.loadingNextSong=true
      this.$socket.emit("nextSong",this.status,this.currentTime)
    },
    isPlaying(playing){
      //console.log('set playing to',playing)
      this.playing=playing
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
