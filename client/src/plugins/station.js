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
    addVariety(stationNumber, str) {
      this.socket.emit('addVariety', stationNumber, str)
    },
    renameCurrentStation(newName) {
      this.socket.emit('renameCurrentStation', newName)
      this.allStations[this.allStations.indexOf(this.current)] = newName
      this.setStations(this.allStations)
    },
    renameStation(stationNumber, newName) {
      this.socket.emit('renameStation', stationNumber, newName)
      this.allStations[stationNumber] = newName
      this.setStations(this.allStations)
    },
    getStation() {
      return this.current
    },
    setStation(newStation) {
      this.current = newStation
      this.save(newStation)
      this.pubSub.publish(CURRENT, newStation)
    },
    getStations: function(filter = a => a) {
      return this.allStations.filter(filter)
    },
    setStations: function(stations) {
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
    get length() {
      return this.allStations.length
    },
    STATIONS,
    CURRENT
  }
export default Station
