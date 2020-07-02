function getSongs() {
	var self = this
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()

	let params = new URLSearchParams(window.location.search)
	self.thisCharId = params.get('char')

	req.onload = function() {
		self.songsData = req.response
		self.thisChar = req.response.find(x=>x.id===self.thisCharId)
	}

	$("[data-toggle=popover]").popover({ html: true })
}

var songTable = new Vue({
	el: '#main',
	data: {
		songsData: [],
		thisChar: {},
		thisCharId: null
	},
	methods: {
		toggle: function (char) {
			if (char.show) char.show = false
			else char.show = true
		}
	},
	mounted: getSongs
})