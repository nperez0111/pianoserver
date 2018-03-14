<template>
  <v-slide-y-transition mode="out-in">
    <div v-resize="onResize">
      <Full-Height class="blue darken-4" v-show="!vertical">
        <v-layout wrap justify-center>
          <v-flex sm5 lg6  v-touch="{up:likeSong,left:nextSong}">
            <v-layout column justify-center fill-height class="px-2">
              <transition name="dialog-transition" mode="out-in">
                <img :src="status.coverArt" :key="status.coverArt" class="fullwidth elevation-2">
              </transition>
            </v-layout>
          </v-flex>
          <v-flex sm7 lg6>
            <v-layout column justify-center fill-height class="px-3">
              <v-spacer></v-spacer>
              <h1 class="headline">{{status.title}}</h1>
              <h3 class="subheading"><span class="light-blue--text accent-2">by</span> {{status.artist}}</h3>
              <h3 class="subheading"><span class="light-blue--text accent-2">on</span> {{status.album}}</h3>
              <v-spacer v-show="$vuetify.breakpoint.smAndDown"></v-spacer>
              <v-layout row class="not-flex">
                <span class="ma-2">
                  {{currentMinutes}}
                </span>
                <v-flex>
                  <v-progress-linear v-model="percentage"></v-progress-linear>
                </v-flex>
                <span class="ma-2">
                  -{{currentTime.now}}
                </span>
              </v-layout>
              <v-layout row class="px-3 not-flex" justify-space-around>
                <v-btn icon fab large flat slot="activator" @click="dislikeSong"  color="red lighten-2">
                  <v-icon>thumb_down</v-icon>
                </v-btn>
                <v-btn icon fab large flat slot="activator" @click="likeSong" :color="liked?'blue lighten-2':''">
                  <v-icon>thumb_up</v-icon>
                </v-btn>
                <v-btn icon fab large @click="playPause">
                  <v-icon v-if="!playing">play_arrow</v-icon>
                  <v-icon v-else>pause</v-icon>
                </v-btn>
                <v-btn icon fab large @click="nextSong">
                  <v-icon>fast_forward</v-icon>
                </v-btn>
              </v-layout>
              <v-spacer></v-spacer>
            </v-layout>
          </v-flex>
        </v-layout>
      </Full-Height>
      <Full-Height class="blue darken-4" v-show="vertical">
        <v-layout column align-center fill-height>
          <v-layout class="my-3 spacer fullwidth" ref="container" justify-center column v-touch="{up:likeSong,left:nextSong}">
            <transition name="dialog-transition" mode="out-in">
              <img :src="status.coverArt" :key="status.coverArt" class="contain elevation-2 mx-auto" ref="vertImage">
            </transition>
          </v-layout>
          <h1 class="headline">{{status.title}}</h1>
          <h3 class="subheading"><span class="light-blue--text accent-2">by</span> {{status.artist}}</h3>
          <h3 class="subheading"><span class="light-blue--text accent-2">on</span> {{status.album}}</h3>
          <div>
            <v-layout row align-center class="mt-3">
              <v-layout column>
                <v-btn icon fab large flat slot="activator" @click="likeSong" :color="liked?'blue lighten-2':''">
                  <v-icon>thumb_up</v-icon>
                </v-btn>
                <v-btn icon fab large flat slot="activator" @click="dislikeSong" color="red lighten-2">
                  <v-icon>thumb_down</v-icon>
                </v-btn>
              </v-layout>
              <v-progress-circular :size="$vuetify.breakpoint.mdAndDown?150:250" :width="16" :rotate="180" v-model="percentage" color="primary">
                <v-btn icon fab large @click="playPause">
                  <v-icon v-if="!playing">play_arrow</v-icon>
                  <v-icon v-else>pause</v-icon>
                </v-btn>
              </v-progress-circular>
              <v-btn icon fab large @click="nextSong">
                <v-icon>fast_forward</v-icon>
              </v-btn>
            </v-layout>
          </div>
        </v-layout>
      </Full-Height>
    </div>
  </v-slide-y-transition>
</template>
<script>
import FullHeight from './Full-Height'
export default {
  mounted() {
      window.player = this

      this.$emit('hideoverflow')
      this.$emit('edit','toolbar',true)
      setTimeout(() => {
        this.onResize()
      }, 400)
    },
    data() {
      const clearAll=[
      this.$station.onchangeStation(station => {
        this.station = station
      }),this.$player.onchangeStatus(state=>{
        const {status,currentTime,playing,liked,disliked,pastSongs}=state
        this.status=status
        this.liked=liked
        this.disliked=disliked
        this.currentTime=currentTime
        this.pastSongs=pastSongs
        this.playing=playing
      })
      ]
      return {
        status: {},
        liked: false,
        disliked: false,
        loadingNextSong: false,
        pastSongs: [],
        currentTime: {
          now: null,
          ofTotal: null
        },
        stations: this.$station.getStations(),
        station: this.$station.getStation(),
        playing: true,
        vertical: true,
        clearAll
      }
    },
    destroy(){
      this.clearAll.forEach(clear=>{
        clear.dispose()
      })
    },
    methods: {
      playPause() {
        this.$player.playPause()
      },
      play() {
        this.$player.play()
      },
      pause() {
        this.$player.pause()
      },
      likeSong() {
        this.$player.likeSong()
      },
      dislikeSong() {
        this.$player.dislikeSong()
      },
      nextSong() {
        this.$player.nextSong()
      },
      onResize() {
        const size = {
          x: window.innerWidth,
          y: window.innerHeight
        }
        this.vertical = size.y > size.x
        if(!this.$refs.vertImage){
          return setTimeout(this.onResize.bind(this),10)
        }

        const height=this.$refs.container.clientHeight,
        width=this.$refs.container.clientWidth
        //console.log(height)
        if(height>0){
          if(height>width){
            this.$refs.vertImage.style.maxHeight = width+'px'
          }
          else{
          this.$refs.vertImage.style.maxWidth = height+'px'
        }
          //console.log('setting',height,this.$refs.vertImage)
        }else{
          setTimeout(this.onResize.bind(this),50)
        }
      }
    },
    computed: {
      nowSeconds() {
        if (this.currentTime.now == null) {
          return 0
        }
        return parseInt(this.currentTime.now.split(":")[0]) * 60 + parseInt(this.currentTime.now.split(":")[1])
      },
      totalSeconds() {
        if (this.currentTime.now == null) {
          return 0
        }
        return parseInt(this.currentTime.ofTotal.split(":")[0]) * 60 + parseInt(this.currentTime.ofTotal.split(":")[1])
      },
      currentSeconds() {
        return this.totalSeconds - this.nowSeconds
      },
      percentage() {

        return (this.currentSeconds / this.totalSeconds) * 100
      },
      currentMinutes() {
        const cur = this.currentSeconds,
          secs = cur % 60,
          minutes = (cur - secs) / 60
        return `${minutes < 10 ? "0"+minutes : minutes}:${ secs < 10 ? "0"+secs : secs}`
      }

    },
    watch:{
      status(newStatus,oldStatus){
        if(newStatus.title!=oldStatus.title){
          setTimeout(this.onResize.bind(this),500)
        }
      }
    },
    components: {
      'Full-Height': FullHeight
    }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .not-flex {
  flex: none;
 }
 
 .fullwidth {
   width: 100%;
  }
  
  .grow {
    flex-grow: 1000 !important;
   }
   
   .contain {
        width: 100%;
     /*   height: auto;
        min-height: 100%;
     object-fit: contain*/
    }
</style>
