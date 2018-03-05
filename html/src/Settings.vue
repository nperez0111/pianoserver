<template>
  <div>
    <v-toolbar color="primary">
      <v-btn to='/' flat>
        <v-icon>arrow_backward</v-icon>
      </v-btn>
      <v-toolbar-title class="white--text">Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn @click="saveSettings" flat>
        <v-icon left>save</v-icon>
        Save
      </v-btn>
    </v-toolbar>
    <!--<v-card>
      <v-card-title>Some planned features</v-card-title>
      <v-card-text>
        <ul>
          <li>customize notifications</li>
          <li>customize shortcuts if on local computer</li>
          <li>customize theme and colors</li>
          <li>customize stations to be included or deleted</li>
          <li>rename stations</li>
          <li>add music to station</li>
          <li></li>
        </ul>
      </v-card-text>
    </v-card>-->
    <v-container>
      <v-list two-line subheader>
        <v-subheader>Pianobar Settings</v-subheader>
        <v-list-tile avatar>
          <v-list-tile-action>
            <v-checkbox v-model="config.showNotifications"></v-checkbox>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Notifications</v-list-tile-title>
            <v-list-tile-sub-title>Allow notifications</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile avatar>
          <v-list-tile-action>
            <v-checkbox v-model="config.openTunnelURL"></v-checkbox>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Open on Startup</v-list-tile-title>
            <v-list-tile-sub-title>Open Pianobar UI (this web app) on startup</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile avatar>
          <v-list-tile-action>
            <v-checkbox v-model="config.listenShortcuts"></v-checkbox>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Listen for Shortcuts</v-list-tile-title>
            <v-list-tile-sub-title>Use Shortcuts to control pianobar</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-subheader v-show="config.listenShortcuts">Shortcut Settings</v-subheader>
      </v-list>
      <v-tabs v-model="active" color="primary" dark slider-color="white" v-show="config.listenShortcuts">
        <v-tab v-for="shortcut in shortcutNames" :key="shortcut" ripple>
          {{ shortcut | splitWord }}
        </v-tab>
        <v-tab-item v-for="shortcut in shortcutNames" :key="shortcut">
          <v-card flat>
            <v-card-title v-if="!editing">Current Shortcut:
              <code v-for="code in toShortcutCodes(shortcut)" v-text="code" class="mx-1" v-if="config.shortcuts[shortcut]"></code>
              <span v-else>None Specified</span>
            </v-card-title>
            <v-card-title v-else>
              Current Shortcut:
              <v-chip v-for="(code,i) in editing" class="mx-1" close @input="editing.splice(i,1)">{{code}}</v-chip>
              <span v-if="editing.length==0">&nbsp;Choose from below the shortcut keys to activate {{shortcut | splitWord | capitalize}}</span>
            </v-card-title>
            <v-card-text>
              <v-btn @click="editing=[]" v-if="!editing">
                <v-icon left>edit</v-icon>
                Edit Shortcut
              </v-btn>
              <div v-else>
                <code v-for="code in keyNames" class="mx-1" @click="editing.push(code)" v-text="code" :key="code" v-show="!editing.includes(code)"></code>
                <v-layout justify-space-between>
                  <v-btn @click="saveEdit(shortcut)" flat color="green">
                    <v-icon left>save</v-icon>
                    Save
                  </v-btn>
                  <v-btn @click="editing=false" flat color="red">
                    Cancel
                  </v-btn>
                </v-layout>
              </div>
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs>
      <v-list two-line subheader>
        <v-subheader>UI Settings</v-subheader>
        <v-list-tile avatar>
          <v-list-tile-action>
            <v-checkbox v-model="ui.darkMode"></v-checkbox>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Dark Mode</v-list-tile-title>
            <v-list-tile-sub-title>Change UI colors</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-container>
  </div>
</template>
<script>
export default {
  data() {
      this.$emit('hideToolbar')
      this.$socket.on('getConfig', config => {
        console.log(config)
        this.config = config
      })
      this.$socket.emit('getConfig')
      return {
        active: '0',
        config: {
          openTunnelURL: true,
          showNotifications: true,
          listenShortcuts: true,
          shortcuts: {},
          keys: {}
        },
        ui: {
          darkMode: true
        },
        editing: false
      }
    },
    methods: {
      saveSettings() {
        const config = this.config
        this.$socket.emit('setAllConfig', config)
      },
      saveEdit(shortcut) {
        const newShortcut = this.editing
        this.config.shortcuts[shortcut] = newShortcut.map(key => this.config.keys[key])
        this.editing = false
      },
      toShortcutCodes(key) {
        const map = this.config.keys,
          codeToName = this.codeToName
        return this.config.shortcuts[key].map(num => {
          return codeToName[num]
        })
      }
    },
    watch: {
      active() {
        this.editing = false
      }
    },
    computed: {
      shortcutNames() {
        return Object.keys(this.config.shortcuts)
      },
      codeToName() {
        const keysObj = this.config.keys
        console.log(keysObj)
        return Object.keys(keysObj).reduce((obj, key) => {
          obj[keysObj[key]] = key
          return obj
        }, {})
      },
      keyNames() {
        return Object.keys(this.config.keys)
      }
    },
    filters: {
      splitWord(word) {
        return word.split(/(?=[A-Z])/).join(" ")
      },
      capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
      }
    }
}
</script>
