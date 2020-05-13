function getSongs() {
	var self = this
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		self.songsData = req.response
		self.songsData.forEach(char=>{
			Vue.set(char, 'show', false)
		})
	}
}

var songTable = new Vue({
	el: '#song-table',
	data: {
		songsData: []
	},
	methods: {
		toggle: function (char) {
			if (char.show) char.show = false
			else char.show = true
		}
	},
	mounted: getSongs
})