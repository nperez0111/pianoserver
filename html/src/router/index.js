import Vue from 'vue'
import Router from 'vue-router'
import Player from '@/components/Player'
import Settings from '@/Settings'

Vue.use(Router)

export default new Router({
  routes: [{
    path: '/',
    name: 'Player',
    component: Player
  }, {
    name: 'Settings',
    path: '/settings',
    component: Settings
  }]
})
