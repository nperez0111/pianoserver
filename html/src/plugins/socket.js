import io from 'socket.io-client'
window.io = io
const socket = {
  count: 0,
  socket: null,
  init(url) {
    this.socket = io(url)

    this.socket.on('disconnect', () => {
      this.socket.on("connect", () => {
        this.socket.emit('getCurrentStatus', 6)
      })
    })
    return this.socket
  },
  install(Vue, options) {
    Vue.prototype.$socket = this
  },
  on(key, cb) {
    return this.socket.on(key, cb)
  },
  emit(eventName, ...args) {
    return this.socket.emit.apply(this.socket, [eventName, ...args])
  }
}

export default socket
