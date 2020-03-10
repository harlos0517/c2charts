function diffId(difficulty) {
	if (difficulty==='easy'  ) return 0
	if (difficulty==='hard'  ) return 1
	if (difficulty==='chaos' ) return 2
	if (difficulty==='glitch') return 3
}

function getSongs(ele) {
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		let res = req.response
		let char = res.find(e=>e.id === ele.charId)
		let song = char.songs.find(e=>e.id === ele.songId)
		ele.character = char.name
		ele.songName = song.name
		ele.composer = song.composer
		ele.level = song.level[ele.difficulty]
	}
}

function getChartData(ele) {
	var req = new XMLHttpRequest()
	req.open('GET', `../images/data/${ele.charId}_${ele.songId}_${ele.diffId}_decrypted.json`)
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		ele.chartData = req.response
	}
}

var main = new Vue({
	el: '#main',
	data: {
		charId: '',
		character: '',
		songId: '',
		songName: '',
		composer: '',
		difficulty: '',
		diffId: 0,
		level: 0,
		chartData: {}
	}, 
	mounted: function() {
		var self = this
		let params = new URLSearchParams(window.location.search)
		self.charId = params.get('charId')
		self.songId = params.get('songId')
		self.difficulty = params.get('diff')
		self.diffId = diffId(self.difficulty)
		getSongs(self)
		getChartData(self)
	}
})