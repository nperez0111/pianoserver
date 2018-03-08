import * as ls from 'local-storage'
import { EventAggregator } from 'aurelia-event-aggregator'

const STATE = 'STATE',
  Config = {
    socket: {},
    config: null,
    pub: new EventAggregator(),
    install(Vue, options) {

      Vue.prototype.$config = this
    },
    init(socket) {
      this.socket = socket

      this.socket.on('getConfig', config => {
        //console.log(config)
        this.config = config
        this.pub.publish(STATE, config)
      })
      this.socket.emit('getConfig')

    },
    on(event, callback) {
      return this.pub.subscribe(event, callback)
    },
    onchangeConfig(callback) {
      return this.on(STATE, callback)
    },
    set(key, value) {
      console.info(`Setting ${key} to`, value)
      this.socket.emit('setConfig', key, value)
    },
    save(newConfig) {
      console.info('Setting config to', newConfig)
      this.socket.emit('setAllConfig', newConfig)
    }
  }
export default Config
