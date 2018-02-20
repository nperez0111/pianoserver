<template>
  <v-slide-y-transition mode="out-in">
    <div v-resize="onResize">
      <Full-Height class="blue darken-4" v-show="!vertical">
        <v-layout wrap justify-center>
          <v-flex xs5 md5 lg5>
            <v-layout column justify-center fill-height class="px-2">
              <img :src="status.coverArt" class="fullwidth elevation-1">
            </v-layout>
          </v-flex>
          <v-flex xs7 md12 lg7>
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
                <v-btn icon fab large flat slot="activator" @click="dislikeSong" color="red lighten-2">
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
          <v-layout class="my-3 spacer fullwidth">
            <img :src="status.coverArt" class="contain elevation-1 mx-auto" ref="vertImage">
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
              <v-progress-circular :size="$vuetify.breakpoint.mdAndDown?150:250" :width="15" :rotate="180" v-model="percentage" color="primary">
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

      this.socketSetup()
      this.$emit('hideoverflow')
      setTimeout(() => {
        this.onResize()
      }, 500)
    },
    data() {
      this.$station.onchangeStation(station => {
        this.station = station
      })
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
        vertical: true
      }
    },
    methods: {
      socketSetup() {
        //server emitted events
        this.$socket.on("status", this.onStatus.bind(this))
        this.$socket.on("currentTime", this.onCurrentTime.bind(this))
        this.$socket.on("isPlaying", this.isPlaying.bind(this))
        this.$socket.on('getPastSongs', this.onGetPastSongs.bind(this))

        //try to initialize with some values
        this.$socket.on("getCurrentStatus", (statuses, isPlaying) => {
          const state = statuses.some(status => {
            if (status && parseInt(status.stationCount) > 0 && status.coverArt && status.stationName) {
              this.stations = this.getStations(status)

              this.onStatus(status)
              this.isPlaying(isPlaying)
              this.setUpSong(status)
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
        this.$socket.emit("getPastSongs")

      },
      setUpSong(status) {
        this.liked = status.rating === '1'
        this.disliked = false
        this.loadingNextSong = false
      },
      onStatus(status) {


        if (typeof status == 'string') {
          this.status = JSON.parse(status)
        } else {
          this.status = status
        }
        const {
          stationName = false, songStationName
        } = this.status

        this.$station.setStations(this.getStations(this.status))
        if (stationName && stationName !== "") {
          this.$station.setStation(stationName === "QuickMix" ? `${stationName} - ${songStationName}` : stationName)
        }
        this.setUpSong(status)
          //console.log(status)
      },
      onCurrentTime(time, isPlaying) {
        this.currentTime = time
        this.isPlaying(isPlaying)
      },
      getStations(state) {
        const amount = state.stationCount
        if (amount) {
          return (new Array(parseInt(amount))).fill(false).map((c, i) => state[`station${i}`])
        }
        return null
      },
      playPause() {
        if (this.playing) {
          this.pause()
        } else {
          this.play()
        }
      },
      play() {
        this.playing = true
        this.$socket.emit("play", this.status, this.currentTime)
      },
      pause() {
        this.playing = false
        this.$socket.emit("pause", this.status, this.currentTime)
      },
      likeSong() {
        if (this.liked) {
          return
        }
        this.liked = true
        this.$socket.emit("likeSong", this.status, this.currentTime)
        setTimeout(() => {
          this.$socket.emit('getCurrentStatus')
          setTimeout(() => {
            console.log(this.liked)
          }, 1000)
        }, 1000)
      },
      dislikeSong() {
        this.disliked = true
        this.$socket.emit("dislikeSong", this.status, this.currentTime)
      },
      nextSong() {
        this.loadingNextSong = true
        this.$socket.emit("nextSong", this.status, this.currentTime)
        this.$socket.emit("getCurrentStatus", 6)
      },
      isPlaying(playing) {
        //console.log('set playing to',playing)
        this.playing = playing
      },
      onGetPastSongs(statuses) {
        this.pastSongs = statuses
        console.log("past songs", this.pastSongs)
      },
      onResize() {
        const size = {
          x: window.innerWidth,
          y: window.innerHeight
        }
        this.vertical = size.y > size.x
        this.$refs.vertImage.width = this.$refs.vertImage.clientHeight
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
     object-fit: contain
    }
</style>
