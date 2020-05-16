function getCharts() {
	var self = this
	var req = new XMLHttpRequest()
	req.open('GET', 'songs_analyzed.json')
	req.responseType = 'json'
	req.send()
	req.onload = function() {
		charts = req.response
		self.chartsDisp = charts.slice()
		self.curSort.col = self.cols[1]
	}
}

function get(e, min) {
	return e[min ? 'min' : 'max']
}

var chartTable = new Vue({
	el: '#chart-table',
	data: function() {
		let self = this
			return {
			charts: [],
			chartsDisp: [],
			cols: [
				{	name: 'Character', type: 'fixed', class: 'char st-th', class2: 'char st-td',
					value: e=>e.char.name },
				{	name: 'Song', type: 'sort',
					key: e=>e.sortIndex, class: 'song st-th', class2: 'song st-td',
					value: e=>e.song.name },
				{	name: 'Composer', type: 'fixed',
					value: e=>e.song.composer },
				{ name: 'DIFF', type: 'sort',
					key: e=>e.diff.id, class: 'diff st-th', class2: 'text-uppercase diff st-td',
					value: e=>e.diff.name },
				{ name: 'Lv', type: 'sort', class: 'lv st-th', class2: 'lv st-td',
					key: e=>e.diff.level },
				{ name: 'Number of', type: 'category', item: [
					{ name:'Page', type: 'sort',
						key: e=>e.numOf.page },
					{ name:'Tempo', type: 'sort',
						key: e=>e.numOf.tempo },
					{ name:'Event', type: 'sort',
						key: e=>e.numOf.event },
					{ name:'Note', type: 'sort',
						key: e=>e.numOf.note }
				]},
				{ name: 'Notes', type: 'category', item: [
					{ name:'Click', type: 'sort',
						key: e=>e.notes[0] },
					{ name:'Hold', type: 'sort',
						key: e=>e.notes[1] },
					{ name:'Long', type: 'sort',
						key: e=>e.notes[2] },
					{ name:'DragH', type: 'sort',
						key: e=>e.notes[3] },
					{ name:'Drag', type: 'sort',
						key: e=>e.notes[4] },
					{ name:'Flick', type: 'sort',
						key: e=>e.notes[5] },
					{ name:'CDragH', type: 'sort',
						key: e=>e.notes[6] },
					{ name:'CDrag', type: 'sort',
						key: e=>e.notes[7] },
				]},
				{ name: 'Time', type: 'sort',
					key: e=>e.time,
					value: e=>self.getTimeStr(e.time) },
				{ name: 'BPM', type: 'minmax',
					key: (e, min)=>get(e.tempo, min),
					value: (e, min)=>self.decimals(get(e.tempo, min), 2) },
				{ name: 'real BPM', type: 'minmax',
					key: (e, min)=>get(e.absTempo, min),
					value: (e, min)=>self.decimals(get(e.absTempo, min), 2) },
				{ name: 'Scanline Speed', type: 'minmax',
					key: (e, min)=>get(e.lineSpeed, min),
					value: (e, min)=>self.decimals(get(e.lineSpeed, min), 2) },
				{ name: 'Beats/Page', type: 'minmax',
					key: (e, min)=>get(e.beats, min) },
				{ name: 'Max Notes/Page', type: 'sort',
					key: e=>e.notePerPage.max },
				{ name: 'Real Max Notes/Page', type: 'sort',
					key: e=>e.notePerPage.realMax },
				{ name: 'Note Density', type: 'sort',
					key: e=>e.notePerPage.densityMax,
					value: (e, min)=>self.decimals(e.notePerPage.densityMax, 2) },
				{ name: 'Real Note Density', type: 'sort',
					key: e=>e.notePerPage.realDensityMax,
					value: (e, min)=>self.decimals(e.notePerPage.realDensityMax, 2) },
				{ name: 'Holds Tick', type: 'minmax',
					key: (e, min)=>get(e.holdTick, min) },
				{ name: 'Holds Time (ms)', type: 'minmax',
					key: (e, min)=>get(e.holdTime, min),
					value: (e, min)=>self.decimals(get(e.holdTime, min)/1000, 2) },
				{ name: 'Max Siblings', type: 'sort',
					key: e=>e.maxSibling },
				{ name: 'Max Finger', type: 'sort',
					key: e=>e.maxFinger }
			],
			curSort: { col: {}, inc: true }
		}
	},
	methods: {
		decimals(num, dec) {
			if (typeof(num)!=='number') return 'NULL'
			else return num.toFixed(dec)
		},
		getTimeStr(us) {
			let sec = us / 1000000
			let m = Math.floor(sec/60)
			let s = ('00'+(sec%60).toFixed(2)).slice(-5)
			return `${m}:${s}`
		},
		sort(col, incr) {
			if (col.type === 'sort' || col.type === 'minmax') {
				console.log('sorting')
				let inc, key
				if (incr !== undefined) inc = incr
				else if (this.curSort.col === col) inc = !this.curSort.inc
				else inc = true
				this.curSort.col = col
				this.curSort.inc = inc
				key = e=>col.key(e, inc)
				this.chartsDisp = this.chartsDisp.slice().sort((a, b)=>{
					return inc ? (key(a) - key(b)) : (key(b) - key(a))
				})
			}
		}
	},
	mounted: getCharts
})

var songTable = new Vue({
	el: '#alert',
	data: {
		width: 0
	},
	mounted: function() {
		this.width = screen.width
	}
})