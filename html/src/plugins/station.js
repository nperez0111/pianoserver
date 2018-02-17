import * as ls from 'local-storage'
import { EventAggregator } from 'aurelia-event-aggregator'

const dev = true,
  STATIONS = 'stations',
  CURRENT = 'station',
  Station = {
    current: null,
    allStations: [],
    pubSub: new EventAggregator(),
    install(Vue, options) {

      Vue.prototype.$station = this
      if (!dev && ls.get('lastStation')) {
        this.allStations = ls.get('stations')
        this.current = ls.get('lastStation')
      }
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
      return
      /*ls.set('lastStation', this.current)
      ls.set('stations')*/

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
