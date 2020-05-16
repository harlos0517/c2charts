const fs = require('fs')

const characters = require('./songs.json')

const difficulty = ['easy', 'hard', 'chaos', 'glitch']

function getTime(tick, tempos, base) {
	let us = 0
	for (let i = 0; tempos[i] && tempos[i].tick < tick; i++) {
		let nextTick = tempos[i+1] ? Math.min(tempos[i+1].tick, tick) : tick
		let deltaTick = nextTick - tempos[i].tick
		us += deltaTick / base * tempos[i].value
	}
	return us
}

function preprocess(data) {
	let pages  = data.page_list
	let tempos = data.tempo_list
	let notes  = data.note_list

	tempos.forEach(tempo=>{
		tempo.bpm = 60000000/tempo.value
	})

	let curTempoIndex = 0
	let tempo = tempos[curTempoIndex]
	let prevTempo = tempos[curTempoIndex]
	let startBeat = 0
	pages.forEach((page, page_index)=>{
		page.dir = page.scan_line_direction
		page.id = page_index
		page.delta = page.end_tick - page.start_tick
		page.next = pages[page_index+1]
		page.prev = pages[page_index-1]
		page.beats = page.delta / data.time_base
		page.start_beat = startBeat
		startBeat = (startBeat + page.beats) % 1

		page.tempos = []
		if (!tempo || page.start_tick < tempo.tick) {
			let newTempo = Object.assign({},prevTempo)
			newTempo.page = page
			newTempo.tick = page.start_tick
			page.tempos.push(newTempo)
		}
		while (tempo && page.end_tick > tempo.tick) {
			page.tempos.push(tempo)
			tempo.page = page
			prevTempo = tempo
			tempo = tempos[++curTempoIndex]
		}
		page.deltaTime = getTime(page.end_tick, page.tempos, data.time_base)
		page.notes = []
	})

	notes.forEach((note)=>{
		note.end_tick = note.tick + note.hold_tick
		let page = pages.find(page=>page.id === note.page_index)
		if (note.is_forward) page = page.prev
		note.page = page
		note.page.notes.push(note)
		note.this_tick = note.tick - note.page.start_tick
		note.beat = note.this_tick % data.time_base
	})

	// find end tick page and time
	notes.forEach((note)=>{
		if (!note.hold_tick) return
		let thisPage = note.page
		let thisTime = getTime(note.tick, thisPage.tempos, data.time_base)
		let time = thisPage.deltaTime - thisTime
		while(thisPage.next && thisPage.next.start_tick < note.end_tick) {
			if (thisPage !== note.page) time += thisPage.deltaTime
			thisPage = thisPage.next
		}
		note.end_page = thisPage
		note.hold_time = time + getTime(note.end_tick, thisPage.tempos, data.time_base)
	})
}

function analyze() {
	let charts = []
	characters.forEach(character=>{
		character.songs.forEach(song=>{
			for (let i = 0; i < 4; i++) {
				if (song.charts[difficulty[i]]) {
					let chart = song.charts[difficulty[i]]
					let data = require(`./data/${character.id}_${song.id}_${i}_decrypted.json`)
					preprocess(data)
					chart.char = { name: character.name, id: character.id, color: character.color }
					chart.song = { name: song.name, id: song.id, composer: song.composer }
					chart.diff = { name: difficulty[i], id: i, level: chart.level }
					let pages  = data.page_list
					let tempos = data.tempo_list
					let events = data.event_order_list
					let notes  = data.note_list
					// get lengths
					chart.numOf = {
						page: pages.length,
						tempo: tempos.length,
						event: events.length,
						note: notes.length
					}
					// get note types number
					chart.notes = []
					for (let i = 0; i < 8; i++) chart.notes.push(notes.filter(x=>x.type === i).length)
					// get total time
					let lastTick = Math.max(...data.note_list.map(note=>note.tick+note.hold_tick))
					chart.time = getTime(lastTick, tempos, data.time_base)
					// get tempo min max
					chart.tempo = {
						min: Math.min(...tempos.map(x=>x.bpm)),
						max: Math.max(...tempos.map(x=>x.bpm))
					}
					chart.absTempo = {
						min: Math.min(...tempos.map(x=>x.bpm).filter(x=>(x > 60 && x < 325))),
						max: Math.max(...tempos.map(x=>x.bpm).filter(x=>(x > 60 && x < 325)))
					}
					let lineSpeeds = [].concat(...pages.map(page=>(page.tempos.map(tempo=>tempo.bpm/page.beats))))
					chart.lineSpeed = {
						min: Math.min(...lineSpeeds),
						max: Math.max(...lineSpeeds)
					}
					chart.beats = {
						min: Math.min(...pages.map(x=>x.beats)),
						max: Math.max(...pages.map(x=>x.beats))
					}
					// get notes per page
					chart.notePerPage = {
						max: Math.max(...pages.map(x=>x.notes.length)),
						realMax: Math.max(...pages.map(x=>x.notes.filter(x=>x.type!==4&&x.type!==7).length)),
						densityMax: Math.max(...pages.map(page=>(page.notes.length-1) / page.deltaTime * 1000000)),
						realDensityMax: Math.max(...pages.map(page=>(page.notes.filter(x=>x.type!==4&&x.type!==7).length-1) / page.deltaTime * 1000000))
					}
					// get hold
					chart.holdTick = {
						min: Math.min(...notes.map(x=>x.hold_tick).filter(x=>x!==0)) || 0,
						max: Math.max(...notes.map(x=>x.hold_tick).filter(x=>x!==0)) || 0
					}
					chart.holdTime = {
						min: Math.min(...notes.filter(x=>x.hold_tick!==0).map(x=>x.hold_time)) || 0,
						max: Math.max(...notes.filter(x=>x.hold_tick!==0).map(x=>x.hold_time)) || 0
					}
					// siblings
					let group = { tick: -1, len: 0, len2: 0, flag: false }
					let max = 1
					notes.forEach(note=>{
						if (note.has_sibling) {
							if(note.tick !== group.tick && group.flag) { // handle existing group
								if (group.len  > max ) max  = group.len
								group = { tick: -1, len: 0, len2: 0, flag: false }
							}
							// same group
							group.tick = note.tick
							group.len++
							group.flag = true
						} else if (group.flag) { // handle existing group
							if (group.len  > max ) max  = group.len
							group = { tick: -1, len: 0, len2: 0, flag: false }
						}
					})
					if (group.flag && group.len  > max ) max  = group.len
					chart.maxSibling = max
					// max fingers
					let finger = 0
					let fingerMax = 1
					let cur = []
					notes.forEach((note, i)=>{
						cur.forEach((x,xi)=>{
							if (note.tick > x) cur.splice(xi,1)
						})
						if (note.hold_tick) cur.push(note.end_tick)
						else if (note.type !== 4 && note.type !== 7) finger ++
						if (finger+cur.length > fingerMax) fingerMax = finger+cur.length
						if (!notes[i+1] || note.tick < notes[i+1].tick) finger = 0
					})
					chart.maxFinger = fingerMax
					chart.sortIndex = charts.length
					charts.push(chart)
				}
			}
		})
	})
	fs.writeFileSync(`../web/songs_analyzed.json`, JSON.stringify(charts, null, '\t'))
}

analyze()
