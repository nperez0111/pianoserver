<template>
  <div>
    <v-toolbar color="primary">
      <v-btn to='/' flat>
        <v-icon left>arrow_back</v-icon> Now Playing
      </v-btn>
      <v-toolbar-title class="white--text">{{stationName}} Station Settings</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-alert type="error" :value="!isCurrentlyPlaying">The current station is not currently playing, in order to change the settings below we will switch this to be the now playing station. </v-alert>
    <v-card class="my-1">
      <v-card-title class="title">Rename Station</v-card-title>
      <v-card-text>
        <v-layout>
          <v-text-field v-model="stationName" label="Change Station Name To:" class="mr-2"></v-text-field>
          <v-btn color="primary" @click="$station.renameStation(id,stationName)">
            <v-icon left>save</v-icon>Save
          </v-btn>
        </v-layout>
      </v-card-text>
    </v-card>
    <v-card class="my-1">
      <v-card-title class="title">Add Variety To This Station</v-card-title>
      <v-card-text>
        <v-layout>
          <v-text-field v-model="variety" label="Add To This Station, Music By:" class="mr-2"></v-text-field>
          <v-btn color="primary" @click="$station.addVariety(id,variety),variety=''">
            <v-icon left>save</v-icon>Save
          </v-btn>
        </v-layout>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
export default {
  data() {
    window.stationSet=this
      const stationNum = Number(this.id)

      this.$station.onchangeStations(stations => {
        this.stationName = stations[stationNum]
      })
      this.$emit('edit', 'toolbar', false)
      this.$emit('showoverflow')
      return {
        variety: "",
        stationName: this.$station.getStations()[stationNum] || ''
      }
    },
    props: {
      id: String
    },
    computed: {
      isCurrentlyPlaying() {
        return this.$station.current === this.stationName
      }
    }
}
</script>
