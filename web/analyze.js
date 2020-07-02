function get(e, min) {
	return e[min ? 'min' : 'max']
}

var chartTable = new Vue({
	el: '#main',
	data: function() {
		let self = this
			return {
			charts: [],
			chartsDisp: [],
			chartsPaged: [],
			curNum: 20,
			cols: [
				{	name: 'Character', type: 'fixed', show: true, disabled: true,
					filter: [], filtered: [], sortFilter: false,
					class: 'char st-th', class2: 'char st-td',
					value: e=>e.char.name },
				{	name: 'Song', type: 'sort', show: true, disabled: true,
					class: 'song st-th', class2: 'song st-td',
					key: e=>e.sortIndex, value: e=>e.song.name },
				{	name: 'Composer', type: 'fixed', show: false,
					class: 'composer', class2: 'composer',
					value: e=>e.song.composer },
				{ name: 'DIFF', type: 'sort', show: true, disabled: true,
					filter: [], filtered: [], sortFilter: true,
					class: 'diff st-th', class2: 'text-uppercase border-0 diff st-td',
					key: e=>e.diff.id, value: e=>e.diff.name },
				{ name: 'Lv', type: 'sort', show: true, disabled: true,
					filter: [], filtered: [], sortFilter: true,
					class: 'lv st-th', class2: 'lv border-0 st-td',
					key: e=>e.diff.level, value: e=>e.diff.level },
				{ name: 'Number of', type: 'category', show: true, item: [
					{ name:'Page', type: 'sort', show: false,
						key: e=>e.numOf.page, value: e=>e.numOf.page },
					{ name:'Tempo', type: 'sort', show: false,
						key: e=>e.numOf.tempo, value: e=>e.numOf.tempo },
					{ name:'Event', type: 'sort', show: false,
						key: e=>e.numOf.event, value: e=>e.numOf.event },
					{ name:'Note', type: 'sort', show: true,
						key: e=>e.numOf.note, value: e=>e.numOf.note }
				]},
				{ name: 'Notes', type: 'category', show: false, item: [
					{ name:'Click', type: 'sort', show: false,
						key: e=>e.notes[0], value: e=>e.notes[0] },
					{ name:'Hold', type: 'sort', show: false,
						key: e=>e.notes[1], value: e=>e.notes[1] },
					{ name:'Long', type: 'sort', show: false,
						key: e=>e.notes[2], value: e=>e.notes[2] },
					{ name:'DragH', type: 'sort', show: false,
						key: e=>e.notes[3], value: e=>e.notes[3] },
					{ name:'Drag', type: 'sort', show: false,
						key: e=>e.notes[4], value: e=>e.notes[4] },
					{ name:'Flick', type: 'sort', show: false,
						key: e=>e.notes[5], value: e=>e.notes[5] },
					{ name:'CDragH', type: 'sort', show: false,
						key: e=>e.notes[6], value: e=>e.notes[6] },
					{ name:'CDrag', type: 'sort', show: false,
						key: e=>e.notes[7], value: e=>e.notes[7] },
				]},
				{ name: 'Time', type: 'sort', show: true,
					key: e=>e.time, value: e=>self.getTimeStr(e.time) },
				{ name: 'BPM', type: 'minmax', show: false,
					key: (e, min)=>get(e.tempo, min),
					value: (e, min)=>self.decimals(get(e.tempo, min), 1) },
				{ name: 'real BPM', type: 'minmax', show: true,
					key: (e, min)=>get(e.absTempo, min),
					value: (e, min)=>self.decimals(get(e.absTempo, min), 1) },
				{ name: 'Scanline Speed', type: 'minmax', show: true,
					key: (e, min)=>get(e.lineSpeed, min),
					value: (e, min)=>self.decimals(get(e.lineSpeed, min), 1) },
				{ name: 'Beats/Page', type: 'minmax', show: false,
					key: (e, min)=>get(e.beats, min),
					value: (e, min)=>self.decimals(get(e.beats, min), 2) },
				{ name: 'Notes/Page', type: 'category', show: true, item: [
					{ name: 'Max', type: 'sort', show: false,
						key: e=>e.notePerPage.max, value: e=>e.notePerPage.max },
					{ name: 'R.Max', type: 'sort', show: true,
						key: e=>e.notePerPage.rMax, value: e=>e.notePerPage.rMax }
				]},
				{ name: 'Notes/Time', type: 'category', show: true, item: [
					{ name: 'Max', type: 'sort', show: false,
						key: e=>e.notePerPage.densityMax,
						value: e=>self.decimals(e.notePerPage.densityMax, 2) },
					{ name: 'R.Max', type: 'sort', show: true,
						key: e=>e.notePerPage.rDensityMax,
						value: e=>self.decimals(e.notePerPage.rDensityMax, 2) },
					{ name: 'Avg', type: 'sort', show: false,
						key: e=>e.notePerPage.density,
						value: e=>self.decimals(e.notePerPage.density, 2) },
					{ name: 'R.Avg', type: 'sort', show: true,
						key: e=>e.notePerPage.rDensity,
						value: e=>self.decimals(e.notePerPage.rDensity, 2) }
				]},
				{ name: 'Hold Beat', type: 'minmax', show: false,
					key: (e, min)=>get(e.holdBeat, min),
					value: (e, min)=>self.decimals(get(e.holdBeat, min), 2) },
				{ name: 'Hold Time (ms)', type: 'minmax', show: false,
					key: (e, min)=>get(e.holdTime, min),
					value: (e, min)=>self.decimals(get(e.holdTime, min)/1000000, 2) },
				{ name: 'Max Siblings', type: 'sort', show: false,
					key: e=>e.maxSibling, value: e=>e.maxSibling },
				{ name: 'Max Finger', type: 'sort', show: true,
					key: e=>e.maxFinger, value: e=>e.maxFinger },
				{ name: 'Rhythm', type: 'fixed', show: true,
					class2: 'text-left text-monospace',
					value: e=>e.topRhythms }
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
				this.chartsPaged = this.chartsDisp.slice(0, 20)
				this.curNum = this.chartsPaged.length
			}
		},
		checkCategory(col, parent) {
			if (col.type === 'category')
				col.item.forEach(x=>x.show=col.show)
			else if (parent &&  col.show)
				parent.show = true
			else if (parent && !col.show && !parent.item.filter(x=>x.show).length)
				parent.show = false
		},
		unique(arr) {
			return [...new Set(arr)]
		},
		filtering() {
			this.chartsDisp = this.charts.filter(chart=>{
				let outerFlag = true
				this.cols.filter(x=>x.filter).forEach(col=>{
					let flag = false
					col.filtered.forEach(f=>{
						// use == instead of === because filtered values are strings instead of number
						if (col.value(chart) == f) flag = true
					})
					if (!flag) outerFlag = false
				})
				return outerFlag
			})
			this.sort(this.curSort.col, this.curSort.inc)
			this.chartsPaged = this.chartsDisp.slice(0, 20)
		},
		handleScroll(e) {
			if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight &&
				this.curNum < this.chartsDisp.length) {
				console.log("add")
				this.chartsPaged = this.chartsPaged.concat(this.chartsDisp.slice(this.curNum, this.curNum+10))
				this.curNum = this.chartsPaged.length
			}
		}
	},
	mounted: function() {
		var self = this
		var req = new XMLHttpRequest()
		req.open('GET', 'songs_analyzed.json')
		req.responseType = 'json'
		req.send()
		req.onload = function() {
			self.charts = req.response
			self.chartsDisp = self.charts.slice()
			self.curSort.col = self.cols[1]
			self.cols.filter(x=>x.filter).forEach(col=>{
				col.filter = self.unique(self.charts.map(col.value))
				if (col.sortFilter) {
					col.filter = col.filter.sort((a,b)=>{
						return parseInt(a)-parseInt(b)
					})
				}
				col.filtered = col.filter.slice()
			})
			self.chartsPaged = self.chartsDisp.slice(0, 20)
			self.curNum = self.chartsPaged.length
		}
		$("[data-toggle=popover]").popover({ html: true })
		window.addEventListener('scroll', this.handleScroll);
	}
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