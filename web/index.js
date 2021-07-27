function getSongs() {
	var self = this
	var req = new XMLHttpRequest()
	req.open('GET', 'songs.json')
	req.responseType = 'json'
	req.send()

	let params = new URLSearchParams(window.location.search)
	self.thisCharId = params.get('char')

	req.onload = function() {
		const res = req.response
		self.songsData = res.offline_song_pack_list.concat({
			song_pack_id: "other",
			song_pack_name: "other",
			theme_color: "#878787",
			song_info_list: res.other_song_info_list
		})
		self.thisChar = self.songsData.find(x => x.song_pack_id === self.thisCharId)
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