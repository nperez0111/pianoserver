import io from 'socket.io-client'
window.io = io
const socket = {
  socket: null,
  init() {
    this.socket = io('ws://localhost:8081')

    this.socket.on('disconnect', () => {
      this.socket.on("connect", () => {
        this.socket.emit('getCurrentStatus')
      })
    })
    return this.socket
  },
  install(Vue, options) {
    Vue.prototype.$socket = this
    window.socket = this.init()
  },
  on(key, cb) {
    return this.socket.on(key, cb)
  },
  emit(eventName, ...args) {
    return this.socket.emit.apply(this.socket, [eventName, ...args])
  }
}

export default socket
