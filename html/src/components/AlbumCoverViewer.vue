<template>
	<v-layout row>
		<v-flex v-for="albumCover in albumCovers" :key="albumCover" v-if="albumCovers.length" xs4>
			<img :src="albumCover" class="sm"/>
		</v-flex>
		<v-flex>
			<img :src="current" />
		</v-flex>
	</v-layout>
</template>
<script>
	export default {
		props:{
			songs:Array,
			current:String,
			loading:Boolean
		},
		computed:{
			albumCovers(){
				return Array.from(new Set(this.songs.map(song=>song.coverArt).filter(({coverArt})=>coverArt===this.current)))
			}
		}
	}
</script>
<style>
	.sm{
		width:100%;
	}
</style>