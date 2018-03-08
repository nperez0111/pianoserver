<template>
  <div>
    <v-toolbar color="primary">
      <v-btn to='/' flat>
        <v-icon left>arrow_back</v-icon> Now Playing
      </v-btn>
      <v-toolbar-title class="white--text">{{stationName}} Station Settings</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-card class="my-1">
      <v-card-title class="title">Rename Station (Not Working)</v-card-title>
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
      <v-card-title class="title">Add Variety To This Station (Not Working)</v-card-title>
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
      const stationNum = Number(this.id)

      this.$station.onchangeStations(stations => {
        this.stationName = stations[stationNum]
      })
      this.$emit('hideToolbar')
      this.$emit('showoverflow')
      return {
        variety: "",
        stationName: this.$station.getStations()[stationNum] || ''
      }
    },
    props: {
      id: String
    },
    computed: {}
}
</script>
