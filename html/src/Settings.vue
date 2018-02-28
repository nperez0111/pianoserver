<template>
	<div>
		<v-toolbar color="primary">
	      <v-btn to='/' flat>
	      	<v-icon>arrow_backward</v-icon>
	      </v-btn>
	      <v-toolbar-title class="white--text">Settings</v-toolbar-title>
	      <v-spacer></v-spacer>
	    </v-toolbar>
		<v-card><v-card-title>Some planned features</v-card-title><v-card-text><ul><li>customize notifications</li><li>customize shortcuts if on local computer</li><li>customize theme and colors</li><li>customize stations to be included or deleted</li><li>rename stations</li><li>add music to station</li><li></li></ul></v-card-text></v-card>
	</div>
</template>
<script>
	export default {
		data(){
			this.$emit('hideToolbar')
			return {}
		}
	}
</script>