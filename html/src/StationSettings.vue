<template>
	<div>
		<v-toolbar color="primary">
	      <v-btn to='/' flat>
	      	<v-icon left>arrow_backward</v-icon> Now Playing
	      </v-btn>
	      <v-toolbar-title class="white--text">{{stationName}} Station Settings</v-toolbar-title>
	      <v-spacer></v-spacer>
	    </v-toolbar>
		<v-card>
			<v-card-text>
				<ul>
					<li>rename station</li>	
					<li>add variety</li>

				</ul>
			</v-card-text>
		</v-card>
	</div>
</template>
<script>
	export default {
		data(){
			this.$station.onchangeStations(stations=>{
				this.stationName=stations.find((s,i)=>i===Number(this.id))
			})
			this.$emit('hideToolbar')
			return {
				stationName:this.$station.getStations((s,i)=>i===Number(this.id))[0]||''
			}
		},
		props:{
			id:String
		},
		computed:{
		}
	}
</script>