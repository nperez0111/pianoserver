<template>
  <!--<v-layout row>
		<v-flex v-for="albumCover in albumCovers" :key="albumCover" v-if="albumCovers.length==-1" xs4>
			<img :src="albumCover" class="sm"/>
		</v-flex>
		<v-flex>-->
  <div>
    <img :src="current" :class="{'full-width':fullwidth, 'elevation-1':true}" v-if="fullwidth" />
    <v-spacer v-bind:style="{ backgroundImage: 'url(' + current + ')' }" class="album" v-if="fullheight"></v-spacer>
  </div>
  <!--</v-flex>
	</v-layout>-->
</template>
<script>
export default {
  data() {
      window.albumCoverViewer = this
      return {

      }
    },
    props: {
      songs: Array,
      current: String,
      loading: Boolean,
      fullwidth: Boolean,
      fullheight: Boolean
    },
    computed: {
      albumCovers() {
        return Array.from(new Set(this.songs.map(song => song.coverArt).filter(coverArt => coverArt !== this.current)))
      }
    }
}
</script>
<style>
  .full-width {
  width: 100%;
 }
 
 .album {
   background-size: contain;
   background-repeat: no-repeat;
   background-position: center;
   width: 100%;
  }
</style>
