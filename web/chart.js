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
		ele.level = song.charts[ele.difficulty].level
		ele.pageNum = song.charts[ele.difficulty].pageNum
		document.title = `${song.name} [${ele.difficulty.toUpperCase()}] - Cytus II Charts`
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
		pageNum: 0
	}, 
	mounted: function() {
		var self = this
		let params = new URLSearchParams(window.location.search)
		self.charId = params.get('charId')
		self.songId = params.get('songId')
		self.difficulty = params.get('diff')
		self.diffId = diffId(self.difficulty)
		getSongs(self)
	}
})