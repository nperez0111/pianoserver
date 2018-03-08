import values from 'object.values'
values.shim()
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import StationPlugin from './plugins/station'
import SocketPlugin from './plugins/socket'
import PlayerPlugin from './plugins/player'
import ConfigPlugin from './plugins/config'

Vue.use(StationPlugin, {})
Vue.use(SocketPlugin, {})
Vue.use(PlayerPlugin, {})
Vue.use(ConfigPlugin, {})
Vue.use(Vuetify, {
  theme: {
    primary: '#386aff',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107'
  }
})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
