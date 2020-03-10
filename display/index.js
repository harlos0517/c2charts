function getSongs() {
	var self = this
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		self.songsData = req.response
	}
}

var songTable = new Vue({
	el: '#song-table',
	data: {
		songsData: []
	}, 
	mounted: getSongs
})