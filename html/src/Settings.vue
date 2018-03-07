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
              <code v-for="code in toShortcutCodes(shortcut)" v-text="code" class="mx-1" v-show="config.shortcuts[shortcut]&&config.shortcuts[shortcut].length!==0"></code>
              <span v-show="!config.shortcuts[shortcut]||config.shortcuts[shortcut].length===0">&nbsp;None Specified</span>
              <v-btn @click="editing=[]" fab small color="primary">
                <v-icon>edit</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-title v-else>
              <span v-if="editing.length>0">Current Shortcut:</span>
              <v-chip v-for="(code,i) in editing" :key="code" class="mx-1" close @input="editing.splice(i,1)">{{code}}</v-chip>
              <span v-if="editing.length==0">&nbsp;Choose from below the shortcut keys to activate {{shortcut | splitWord | capitalize}} Shortcut</span>
            </v-card-title>
            <v-card-text>
              <div v-if="editing">
                <v-layout justify-center>
                  <v-flex v-for="code in ['BACK_TICK','0','1','2','3','4','5','6','7','8','9','0','MINUS']" :key="code">
                    <v-card light class="mx-1">
                      <v-card-text class="px-0 text-xs-center">{{code | splitByUnderscore}}</v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout justify-center>
                  <v-flex v-for="code in ['TAB','Q','W','E','R','T','Y','U','I','O','P','LEFT_BRACKET','RIGHT_BRACKET']" :key="code">
                    <v-card light class="mx-1">
                      <v-card-text class="px-0 text-xs-center">{{code | splitByUnderscore}}</v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout justify-center>
                  <v-flex v-for="code in ['A','S','D','F','G','H','J','K','L','COLON','SINGLE_QUOTE','PIPE']" :key="code">
                    <v-card light class="mx-1">
                      <v-card-text class="px-0 text-xs-center">{{code | splitByUnderscore}}</v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout justify-center>
                  <v-flex v-for="code in ['BACK_TICK','0','1','2','3','4','5','6','7','8','9','0','MINUS']" :key="code">
                    <v-card light class="mx-1">
                      <v-card-text class="px-0 text-xs-center">{{code | splitByUnderscore}}</v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout justify-center>
                  <v-flex v-for="code in ['SHIFT','Z','X','C','V','B','N','M','COMMA','PERIOD','QUESTION_MARK','RIGHT_SHIFT']" :key="code">
                    <v-card light class="mx-1">
                      <v-card-text class="px-0 text-xs-center">{{code | splitByUnderscore}}</v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout justify-space-between wrap>

                  <v-flex v-for="code in keyNames" :key="code" sm1 v-show="!editing.includes(code)">
                    <code class="mx-1" @click="editing.push(code)">{{code | splitByUnderscore}}</code>
                  </v-flex>
                </v-layout>
                <v-layout justify-space-between>
                  <v-btn @click="saveEdit(shortcut)" flat color="green">
                    <v-icon left>save</v-icon>
                    Save Shortcut
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
        <v-subheader>UI Settings (In Progress)</v-subheader>
        <v-list-tile avatar>
          <v-list-tile-action>
            <v-checkbox v-model="ui.darkMode"></v-checkbox>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Dark Mode (Not working)</v-list-tile-title>
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
      this.$config.onchangeConfig(config => {
        console.log(config)
        this.config = config
      })
      window.setting = this
      return {
        active: '0',
        config: this.$config.config || {
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
      splitByUnderscore(word) {
        return word.split("_").join(" ")
      },
      capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
      }
    }
}
</script>
