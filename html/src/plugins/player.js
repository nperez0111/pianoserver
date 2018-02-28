import * as ls from 'local-storage'
import { EventAggregator } from 'aurelia-event-aggregator'

const dev = true,
  PLAYING = 'PLAYING',
  STATE = 'STATE',
  Station = {
    socket: {},
    station: {},
    state: {
      status: {},
      currentTime: {
        now: null,
        ofTotal: null
      },
      playing: true,
      liked: false,
      disliked: false,
      pastSongs: []
    },

    pub: new EventAggregator(),
    install(Vue, options) {

      Vue.prototype.$player = this
      /*
      if (!dev && ls.get('lastStation')) {
        this.allStations = ls.get('stations')
        this.current = ls.get('lastStation')
      }*/
    },
    init(socket, station) {
      this.socket = socket
      this.station = station

      this.socket.on("status", this.onStatus.bind(this))
      this.socket.on("currentTime", this.onCurrentTime.bind(this))
      this.socket.on("isPlaying", this.setPlaying.bind(this))
      this.socket.on('getPastSongs', this.onGetPastSongs.bind(this))
      this.socket.on("getCurrentStatus", this.onGetCurrentStatus.bind(this))

      //trigger initialize
      this.socket.emit("getCurrentStatus", 6)
      this.socket.emit("getPastSongs")

    },
    on(event, callback) {
      return this.pub.subscribe(event, callback)
    },
    onchangePlaying(callback) {
      return this.on(PLAYING, callback)
    },
    onchangeStatus(callback) {
      return this.on(STATE, callback)
    },
    setPlaying(isPlaying) {
      this.state.playing = isPlaying
      this.pub.publish(PLAYING, isPlaying)
      this.pub.publish(STATE, this.state)
    },
    playPause() {
      if (this.state.playing) {
        this.pause()
      } else {
        this.play()
      }
    },
    play() {
      this.setPlaying(true)
      this.socket.emit("play", this.state.status, this.state.currentTime)
    },
    pause() {
      this.setPlaying(false)
      this.socket.emit("pause", this.state.status, this.state.currentTime)
    },
    likeSong() {
      if (this.liked) {
        return
      }
      this.state.liked = true
      this.pub.publish(STATE, this.state)
      this.socket.emit("likeSong", this.state.status, this.state.currentTime)
      setTimeout(() => {
        this.socket.emit('getCurrentStatus')
      }, 1000)
    },
    dislikeSong() {
      this.state.disliked = true
      this.pub.publish(STATE, this.state)
      this.socket.emit("dislikeSong", this.state.status, this.state.currentTime)
    },
    nextSong() {
      this.state.loadingNextSong = true
      this.pub.publish(STATE, this.state)
      this.socket.emit("nextSong", this.state.status, this.state.currentTime)
      this.socket.emit("getCurrentStatus", 6)
    },
    getStations(state) {
      const amount = state.stationCount
      if (amount) {
        return (new Array(parseInt(amount))).fill(false).map((c, i) => state[`station${i}`])
      }
      return null
    },
    onStatus(status) {


      if (typeof status == 'string') {
        this.state.status = JSON.parse(status)
      } else {
        this.state.status = status
      }

      const {
        stationName = false, songStationName
      } = this.state.status

      this.station.setStations(this.getStations(this.state.status))
      if (stationName && stationName !== "") {
        this.station.setStation(stationName === "QuickMix" ? `${stationName} - ${songStationName}` : stationName)
      }
      this.setUpSong(status)
      this.pub.publish(STATE, this.state)
      //console.log(status)
    },
    setUpSong(status) {
      this.state.liked = status.rating === '1'
      this.state.disliked = false
      this.state.loadingNextSong = false
    },
    onCurrentTime(time, isPlaying) {
      this.state.currentTime = time
      this.setPlaying(isPlaying)
      this.pub.publish(STATE, this.state)
    },
    onGetPastSongs(statuses) {
      this.state.pastSongs = statuses
      this.pub.publish(STATE, this.state)
      console.log("past songs", this.state.pastSongs)
    },
    onGetCurrentStatus(statuses, isPlaying) {
      const state = statuses.some(status => {
        if (status && parseInt(status.stationCount) > 0 && status.coverArt && status.stationName) {
          this.stations = this.getStations(status)

          this.onStatus(status)
          this.setPlaying(isPlaying)
          return true
        }
      })

      if (this.station.getStation() === null) {
        setTimeout(() => {
          this.$socket.emit("getCurrentStatus", 10)
        }, 1000)
      }

    }
  }
export default Station
