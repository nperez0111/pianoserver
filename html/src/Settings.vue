<template>
  <div>
    <v-toolbar color="primary">
      <v-btn flat icon to="/">
        <v-icon>arrow_back</v-icon>
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
    <v-container class="pa-0">
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
      <v-tabs v-model="active" color="primary" dark slider-color="white" v-show="config.listenShortcuts" grow show-arrows>
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
              <v-layout column>
                <v-flex>
                  <span>Old Shortcut:</span>
                  <v-chip v-for="(code,i) in toShortcutCodes(shortcut)" :key="code" class="mx-1">{{code}}</v-chip>
                  <span v-show="!config.shortcuts[shortcut]||config.shortcuts[shortcut].length===0">&nbsp;None Specified</span>
                </v-flex>
                <v-flex>
                  <span v-if="editing.length>0">Current Shortcut:</span>
                  <v-chip v-for="(code,i) in editing" :key="code" class="mx-1" close @input="editing.splice(i,1)">{{code}}</v-chip>
                </v-flex>
                <v-flex>
                  <span v-if="editing.length==0">Choose from below the shortcut keys to activate {{shortcut | splitWord | capitalize}} Shortcut</span>
                </v-flex>
              </v-layout>
            </v-card-title>
            <v-card-text :class="{'px-0':$vuetify.breakpoint.mdAndDown}">
              <div v-if="editing">
                <v-layout justify-center v-for="row in keyboard" :key="row.toString()">
                  <v-flex v-for="code in row" :key="valOf(code)" :class="{['xs'+code.grow]:true}" @click="!editing.includes(valOf(code)) && editing.push(valOf(code))">
                    <v-card :light="!editing.includes(valOf(code))" :raised="!editing.includes(valOf(code))" :color="editing.includes(valOf(code))?'green':'light'" :class="{'ma-1':$vuetify.breakpoint.mdAndUp,'no-radius':$vuetify.breakpoint.mdAndDown}" :flat="$vuetify.breakpoint.mdAndDown">
                      <v-card-text :class="{'pa-2':$vuetify.breakpoint.mdAndUp, 'py-1':$vuetify.breakpoint.smAndDown,'px-0':$vuetify.breakpoint.smAndDown ,'text-xs-center':true}" v-html="valOf(code,true)"></v-card-text>
                    </v-card>
                  </v-flex>
                </v-layout>
                <v-layout>
                  <v-spacer></v-spacer>
                  <v-flex xs12 sm6 md4 lg3 xl2 class="mt-2">
                    <v-layout justify-center>
                      <v-flex v-for="code in arrowKeys.slice(0,1)" :key="valOf(code)" :class="{['xs'+code.grow]:true}" @click="!editing.includes(valOf(code)) && editing.push(valOf(code))">
                        <v-card :light="!editing.includes(valOf(code))" :raised="!editing.includes(valOf(code))" :color="editing.includes(valOf(code))?'green':'light'" :class="{'ma-1':$vuetify.breakpoint.mdAndUp,'no-radius':$vuetify.breakpoint.mdAndDown}" :flat="$vuetify.breakpoint.mdAndDown">
                          <v-card-text :class="{'pa-2':$vuetify.breakpoint.mdAndUp, 'py-1':$vuetify.breakpoint.smAndDown,'px-0':$vuetify.breakpoint.smAndDown ,'text-xs-center':true}" v-html="valOf(code,true)"></v-card-text>
                        </v-card>
                      </v-flex>
                    </v-layout>
                    <v-layout>
                      <v-flex v-for="code in arrowKeys.slice(1)" :key="valOf(code)" :class="{['xs'+code.grow]:true}" @click="!editing.includes(valOf(code)) && editing.push(valOf(code))">
                        <v-card :light="!editing.includes(valOf(code))" :raised="!editing.includes(valOf(code))" :color="editing.includes(valOf(code))?'green':'light'" :class="{'ma-1':$vuetify.breakpoint.mdAndUp,'no-radius':$vuetify.breakpoint.mdAndDown}" :flat="$vuetify.breakpoint.mdAndDown">
                          <v-card-text :class="{'pa-2':$vuetify.breakpoint.mdAndUp, 'py-1':$vuetify.breakpoint.smAndDown,'px-0':$vuetify.breakpoint.smAndDown ,'text-xs-center':true}" v-html="valOf(code,true)"></v-card-text>
                        </v-card>
                      </v-flex>
                    </v-layout>
                  </v-flex>
                </v-layout>
                <!--<v-layout justify-space-between wrap>

                  <v-flex v-for="code in keyNames" :key="code" sm1 v-show="!editing.includes(code)">
                    <code class="mx-1" @click="editing.push(code)">{{code | splitByUnderscore}}</code>
                  </v-flex>
                </v-layout>-->
                <v-layout class="mt-3">
                  <v-btn @click="editing=false" color="red">
                    Cancel
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn @click="saveEdit(shortcut)" color="green">
                    <v-icon left>save</v-icon>
                    Save Shortcut
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
        editing: false,
        keyboard: [
          ['ESC', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
          [{
            name: 'BACK_TICK',
            symbol: '`'
          }, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', {
            name: 'MINUS',
            symbol: '-'
          }],
          ['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', {
            name: 'LEFT_BRACKET',
            symbol: '['
          }, {
            name: 'RIGHT_BRACKET',
            symbol: ']'
          }],
          ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', {
            name: 'COLON',
            symbol: ':'
          }, {
            name: 'SINGLE_QUOTE',
            symbol: "'"
          }, {
            name: 'BACK_SLASH',
            symbol: "\\"
          }],
          [{
            name: 'LEFT_SHIFT',
            symbol: "&#x21E7;",
            grow: 2
          }, 'Z', 'X', 'C', 'V', 'B', 'N', 'M', {
            name: 'COMMA',
            symbol: ","
          }, {
            name: 'PERIOD',
            symbol: '.'
          }, {
            name: 'FORWARD_SLASH',
            symbol: "/"
          }, {
            name: 'RIGHT_SHIFT',
            symbol: "&#x21E7;",
            grow: 2
          }],
          [{
            name: 'LEFT_CTRL',
            symbol: "CTRL"
          }, {
            name: 'LEFT_COMMAND',
            symbol: "&#x2318;"
          }, 'ALT', {
            name: 'SPACE',
            symbol: 'SPACE',
            grow: 6
          }, {
            name: 'RIGHT_ALT',
            symbol: "ALT"
          }, {
            name: 'RIGHT_COMMAND',
            symbol: "&#x2318;"
          }, {
            name: 'RIGHT_CTRL',
            symbol: "CTRL"
          }]
        ],
        arrowKeys: [{
          name: 'UP',
          symbol: "↑",
          grow: 4
        }, {
          name: 'LEFT',
          symbol: "←",
          grow: 4
        }, {
          name: 'DOWN',
          symbol: "↓",
          grow: 4
        }, {
          name: 'RIGHT',
          symbol: "→",
          grow: 4
        }]
      }
    },
    methods: {
      valOf(obj, symbol) {
        if (typeof obj === 'string') {
          return obj
        }
        if (symbol) {
          return obj.symbol
        }
        return obj.name
      },
      saveSettings() {
        const config = this.config
        this.$config.save(config)
      },
      saveEdit(shortcut) {
        const newShortcut = this.editing
        this.config.shortcuts[shortcut] = newShortcut.map(key => this.config.keys[key])
        this.editing = false
        this.$config.set(`shortcuts.${shortcut}`, this.conf.shortcuts[shortcut])
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
<style>
 .no-radius {
  border-radius: unset!important;
  border: 1px solid #DDD;
 }
</style>
