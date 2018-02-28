<template>
	<v-container>
		<v-btn to='/'><v-icon left>arrow_backward</v-icon>Back</v-btn>
		{{$station.getStations((s,i)=>i===Number(id))[0]}}
	</v-container>
</template>
<script>
	export default {
		data(){
			return {}
		},
		props:{
			id:String
		}
	}
</script>