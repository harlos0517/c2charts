function diffId(difficulty) {
	if (difficulty==='easy'  ) return 'Easy'  
	if (difficulty==='hard'  ) return 'Hard'  
	if (difficulty==='chaos' ) return 'Chaos' 
	if (difficulty==='glitch') return 'Glitch'
	if (difficulty==='crash' ) return 'Crash' 
}

function getSongs(ele) {
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		let res = req.response.offline_song_pack_list.concat({
			song_pack_id: "other",
			song_pack_name: "other",
			theme_color: "#878787",
			song_info_list: req.response.other_song_info_list
		})
		let char = res.find(e => e.song_pack_id === ele.charId)
		let song = char.song_info_list.find(e=>e.song_id === ele.songId)
		let other = char.song_pack_id === 'other'
		ele.character = char
		ele.song = song
		ele.level = other ? '?' : song.charts[ele.diffId].Level
		ele.pageNum = other ? song.pageNum : song.charts[ele.diffId].pageNum
		ele.curPageNum = Math.min(ele.pageNum, 16)
		document.title = `${song.song_name || song.song_id} [${ele.difficulty.toUpperCase()}] - Cytus II Chart Viewer`
	}
}

var main = new Vue({
	el: '#main',
	data: {
		charId: '',
		character: {},
		songId: '',
		song: {},
		difficulty: '',
		diffId: 0,
		level: 0,
		pageNum: 0,
		curPageNum: 0,
		header: false
	}, 
	methods: {
		handleScroll(e) {
			if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 100 &&
				this.curPageNum < this.pageNum) {
				console.log("add")
				this.curPageNum = Math.min(this.pageNum, this.curPageNum + 16)
			}
			if (window.pageYOffset > 240) this.header = true
			else this.header = false
		}
	}, 
	mounted: function() {
		var self = this
		let params = new URLSearchParams(window.location.search)
		self.charId = params.get('charId')
		self.songId = params.get('songId')
		self.difficulty = params.get('diff')
		self.diffId = diffId(self.difficulty)
		getSongs(self)
		$("[data-toggle=popover]").popover({ html: true })
		window.addEventListener('scroll', this.handleScroll);
	}
})