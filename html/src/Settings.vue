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
      </v-list>
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
        config: {
          openTunnelURL: true,
          showNotifications: true,
          listenShortcuts: true
        },
        ui: {
          darkMode: true
        }
      }
    },
    methods: {
      saveSettings() {
        const config = this.config
        this.$socket.emit('setAllConfig', config)
      }
    }
}
</script>
