import * as ls from 'local-storage'
import { EventAggregator } from 'aurelia-event-aggregator'

const dev = false,
  STATIONS = 'stations',
  CURRENT = 'station',
  Station = {
    current: null,
    socket: null,
    allStations: [],
    pubSub: new EventAggregator(),
    install(Vue, options) {

      Vue.prototype.$station = this
      if (!dev && ls.get('lastStation')) {
        this.allStations = ls.get('stations')
        this.current = ls.get('lastStation')
      }
    },
    init(socket) {
      this.socket = socket
    },
    updateStatus(cb) {
      this.socket.emit("getCurrentStatus")
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          cb.bind(this)
          resolve()
        }, 700)
      })
    },
    addVariety(stationNumber, str) {
      this.updateStatus().then(() => {
        if (this.isCurrentStation(stationNumber)) {
          this.socket.emit('addVarietyToCurrentStation', str)
        } else {
          this.socket.emit('addVariety', this.allStations[stationNumber], str)
        }
      })
    },
    renameStation(stationNumber, newName) {
      this.updateStatus().then(() => {
        if (this.isCurrentStation(stationNumber)) {
          this.socket.emit('renameCurrentStation', newName)
        } else {
          this.socket.emit('renameStation', stationNumber, newName)
        }
        this.allStations[stationNumber] = newName
        this.setStations(this.allStations)
      })
    },
    getStation() {
      return this.current
    },
    setStation(newStation) {
      this.current = newStation
      this.save(newStation)
      this.pubSub.publish(CURRENT, newStation)
    },
    getStations: function (filter = a => a) {
      return this.allStations.filter(filter)
    },
    setStations: function (stations) {
      this.allStations = stations
      this.pubSub.publish(STATIONS, stations)
      ls.set('stations', stations)
    },
    on(event, callback) {
      return this.pubSub.subscribe(event, callback)
    },
    onchangeStation(callback) {
      return this.on(CURRENT, callback)
    },
    onchangeStations(callback) {
      return this.on(STATIONS, callback)
    },
    save(station) {
      ls.set('lastStation', station)
    },
    clear() {
      ls.clear()
      this.current = null

    },
    isCurrentStation(stationNumber) {
      return this.allStations[stationNumber] === this.current
    },
    get length() {
      return this.allStations.length
    },
    STATIONS,
    CURRENT
  }
export default Station
