const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')
const assert = require('assert')

const canvasWidth = 1920
const canvasHeight = 1440
const margin = {
	'top': 180,
	'bottom' : 140,
	'side' : 100
}
const noteAreaWidth = canvasWidth - 2 * margin.side
const noteAreaHeight = canvasHeight - margin.top - margin.bottom
const noteRatio = 1

const fonts = [{
	src: 'Rajdhani-SemiBold.ttf',
	family: 'Rajdhani'
},{
	src: 'Electrolize-Regular.ttf',
	family: 'Electrolize'
}]

const noteTypes = [{
	name: 'regular',
	up:   { src: 'note_up.png' },
	down: { src: 'note_down.png' }
},{
	name: 'hold',
	up:   { src: 'hold_up.png' },
	down: { src: 'hold_down.png' },
	tail: { src: 'hold_tail.png'}
},{
	name: 'long hold',
	up:   { src: 'long_hold.png' },
	down: { src: 'long_hold.png' },
	tail: { src: 'long_hold_tail.png'}
},{
	name: 'chain head',
	up:   { src: 'chain_head_up.png' },
	down: { src: 'chain_head_down.png' }
},{
	name: 'chain',
	up:   { src: 'chain_up.png' },
	down: { src: 'chain_down.png' }
},{
	name: 'flick',
	up:   { src: 'flick_up.png' },
	down: { src: 'flick_down.png' }
},{
	name: 'drag head',
	up:   { src: 'note_up.png' },
	down: { src: 'note_down.png' }
},{
	name: 'drag',
	up:   { src: 'drag_up.png' },
	down: { src: 'drag_down.png' }
}]

const beats = [
	{ num: 0, div: 1, color: '#C7C7C7', lineWidth: 4, global: true  },
	{ num: 1, div: 2, color: '#787878', lineWidth: 3, global: true  },
	{ num: 1, div: 3, color: '#0078A2', lineWidth: 2, global: false },
	{ num: 2, div: 3, color: '#0078A2', lineWidth: 2, global: false },
	{ num: 1, div: 4, color: '#787878', lineWidth: 2, global: false },
	{ num: 3, div: 4, color: '#787878', lineWidth: 2, global: false },
	{ num: 1, div: 6, color: '#003C54', lineWidth: 1, global: false },
	{ num: 5, div: 6, color: '#003C54', lineWidth: 1, global: false },
	{ num: 1, div: 8, color: '#424242', lineWidth: 1, global: false },
	{ num: 3, div: 8, color: '#424242', lineWidth: 1, global: false },
	{ num: 5, div: 8, color: '#424242', lineWidth: 1, global: false },
	{ num: 7, div: 8, color: '#424242', lineWidth: 1, global: false }
]

function loadAssets(){
	fonts.forEach(font=>{ registerFont(font.src, { family: font.family }) })
	let promises = []
	noteTypes.forEach(noteType=>{
		promises.push = loadImage(noteType.up  .src).then(image=>{ noteType.up  .image = image })
		promises.push = loadImage(noteType.down.src).then(image=>{ noteType.down.image = image })
		if (noteType.tail) {
			let tail = noteType.tail
			promises.push = loadImage(tail.src).then(image=>{ tail.image = image })
		}
	})
	return Promise.all(promises)
}

function yPos(dir, ratio) {
	let r = Math.max(0, Math.min(1, ratio))
	let verDist = noteAreaHeight * r
	return (dir === 1) ? (margin.top + noteAreaHeight - verDist) : (margin.top + verDist)
}

function writeText(ctx, str, x, y, align, fontSize) {
	let arr = str.split('')
	if (align === 'right') arr = arr.reverse()
	let xi
	arr.forEach((ch,i)=>{
		xi = x + (fontSize*.3 + fontSize*.6*i) * ((align === 'right') ? -1 : 1)
		ctx.fillText(ch, xi, y)
	})
	return xi + fontSize*.3*((align === 'right') ? -1 : 1)
}

function writeBpm(ctx, bpm, x, y, fontSize) {
	let [int, dec] = bpm.toFixed(2).split('.');
	let xn = writeText(ctx, dec, x            , y, 'right', fontSize)
	    xn = writeText(ctx, '.', xn+fontSize/6, y, 'right', fontSize)
			xn = writeText(ctx, int, xn+fontSize/6, y, 'right', fontSize)
	return xn
}

function initCanvas(ctx, page, bpmChange) {
	// background
	ctx.fillStyle = '#191919'
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	ctx.fillStyle = '#060606'
	ctx.fillRect(0, margin.top, canvasWidth, noteAreaHeight)

	// page index
	let fontSize = 100
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'center'
	ctx.fillStyle = '#FFFFFF'
	writeText(ctx, page.id.toString().padStart(3, '0'), fontSize*.2, fontSize, 'left', fontSize)

	// BPM
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'center'
	let bpm  = page.tempos[0].bpm
	let color = '#FFFFFF'
	ctx.fillStyle = color
	writeText(ctx, 'BPM', canvasWidth - fontSize*.3, fontSize, 'right', fontSize)
}

function getBpmChange(a, b) {
	return Math.log2(a) - Math.log2(b)
}

function drawTempoChange(ctx, page, initBpmChange) {
	let tempos = page.tempos
	let initBpm = tempos[0].bpm
	tempos.forEach((tempo, tempoIndex, tempos)=>{
		let bpmChange = getBpmChange(tempo.bpm, initBpm)
		let hex = Math.min(168, Math.round(Math.abs(255 * bpmChange))).toString(16).padStart(2,'0')
		let color
		     if (bpmChange > 0) color = `#FF0000${hex}`
		else if (bpmChange < 0) color = `#00FF66${hex}`
		else return
		ctx.fillStyle = color
		let start = yPos(page.dir, (tempo.tick - page.start_tick) / page.delta)
		let end = yPos(page.dir, tempos[tempoIndex+1] ? ((tempos[tempoIndex+1].tick - page.start_tick) / page.delta) : 1)
		if (start > end) [start, end] = [end, start]
		ctx.fillRect(0, start, canvasWidth, end - start)
	})
	let y = (page.dir > 0) ? canvasHeight : 0
	tempos.forEach((tempo, tempoIndex, tempos)=>{
		let bpmChange = tempoIndex ? getBpmChange(tempo.bpm, initBpm) : initBpmChange
		let fontSize = 60
		ctx.font = `${fontSize}px "Rajdhani"`
		let color2 = '#FFFFFF'
		if (bpmChange > 0) color2 = '#FF8888'
		if (bpmChange < 0) color2 = '#88FFBB'
		ctx.fillStyle = color2
		let start = yPos(page.dir, (tempo.tick - page.start_tick) / page.delta)
		let end = yPos(page.dir, tempos[tempoIndex+1] ? ((tempos[tempoIndex+1].tick - page.start_tick) / page.delta) : 1)
		if (start > end) [start, end] = [end, start]
		y = (page.dir > 0) ? Math.min(y, end - fontSize*.2) : Math.max(y, start + fontSize)
		writeBpm(ctx, tempo.bpm, canvasWidth - fontSize*.3, y, fontSize)
		y -= fontSize * page.dir
	})
}

function drawDirection(ctx, page, lineSpeedChange) {
	let thickness = 80
	let grdStart = margin.top + ((page.dir > 0) ?  noteAreaHeight : 0)
	let grdEnd   = margin.top + ((page.dir > 0) ? (noteAreaHeight - thickness) : thickness)
	let grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd);
	let color = '#FFFFFF'
	if (lineSpeedChange > 0) color = '#FF8888'
	if (lineSpeedChange < 0) color = '#88FFBB'
	ctx.fillStyle = color
	grd.addColorStop(0, `${color}90`)
	grd.addColorStop(1, `${color}00`)
	ctx.fillStyle = grd
	ctx.fillRect(0, (page.dir > 0) ? grdEnd : grdStart, canvasWidth, thickness)
}

function drawBeatLines(ctx, page) {
	beats.forEach(beat=>{
		if (!beat.global) return
		for (let beatInt = 0; ; beatInt++) {
			let curBeat = beatInt + beat.num/beat.div + page.start_beat
			if (curBeat < 0) continue
			if (curBeat > page.beats) break
			drawBeatLine(ctx, yPos(page.dir, curBeat/page.beats), beat.color, beat.lineWidth)
		}
	})
}

function drawBeatLine(ctx, y, color, lineWidth) {
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = color
	ctx.beginPath()
	ctx.moveTo(0, y)
	ctx.lineTo(canvasWidth, y)
	ctx.stroke()
}

function approx(a, b, err) {
	return (Math.abs(a - b) < err)
}

function drawNoteLine(note, ctx, base, startBeat) {
	let length = 300
	if (note.type === 5) length = 450
	if (note.type === 4) length = 200
	if (note.type === 7) length = 200
	let color
	beats.forEach(beat=>{
		if (!beat.global && approx(note.beat * beat.div + startBeat, base * beat.num, 5 * beat.div))
			color = beat.color
	})
	if (!color) return
	ctx.beginPath()
	ctx.lineWidth = 4
	ctx.strokeStyle = color
	ctx.setLineDash([])
	ctx.moveTo(note.xPos - length/2, note.yPos)
	ctx.lineTo(note.xPos + length/2, note.yPos)
	ctx.stroke()
}

function drawTail(note, page, ctx) {
	let tail = noteTypes[note.type].tail.image
	let ratio = (note.type === 2) ? .8 : 1.4
	let width  = tail.width  * ratio * noteRatio
	let height = tail.height * ratio * noteRatio
	let top = margin.top
	let bottom = canvasHeight - margin.bottom

	let start = (page === note.page) ? note.yPos : ((page.dir > 0) ? bottom : top)
	let end = (page === note.end_page) ? note.endYPos : ((page.dir > 0) ? top : bottom)
	if (page.dir > 0) [ start, end ] = [ end, start ]
	for (let point = start; point < end; point += height)
		ctx.drawImage(tail, note.xPos - width/2, point, width, Math.min(height, end - point))
}

function drawLink(note, ctx) {
	ctx.beginPath()
	ctx.lineWidth = 23 * noteRatio
	ctx.setLineDash([9 * noteRatio, 9 * noteRatio])
	ctx.strokeStyle = '#FFFFFFBB'
	ctx.moveTo(note.xPos, note.yPos)
	ctx.lineTo(note.next.xPos, note.next.yPos)
	ctx.stroke()
}

function getRotate(note) {
	if (!note.next) return (note.page.dir > 0) ? Math.PI/2 : -Math.PI/2
	let dx = note.next.xPos - note.xPos
	let dy = note.next.yPos - note.yPos
	return Math.atan2(dx, -dy)
}

function drawNote(note, ctx, dir, shrink) {
	if (!noteTypes[note.type]) return console.log('Unknown note type')
	let noteObj = noteTypes[note.type][dir].image
	let ratio = (note.type === 4 || note.type === 7) ? 0.6 : 1
	if (shrink) ratio *= 0.8
	let width  = noteObj.width  * ratio * noteRatio
	let height = noteObj.height * ratio * noteRatio
	let rotate = (note.type === 3) ? getRotate(note) - Math.PI/4 : 0
	if (rotate) {
		ctx.save()
		ctx.translate(note.xPos, note.yPos)
		ctx.rotate(rotate)
		ctx.translate(-width/2, -height/2)
		ctx.drawImage(noteObj, 0, 0, width, height)
		ctx.restore()
	} else {
		ctx.drawImage(noteObj, note.xPos - width/2, note.yPos - height/2, width, height)
	}
}

function preprocess(data) {
	let pages  = data.page_list
	let tempos = data.tempo_list
	let events = data.event_order_list
	let notes  = data.note_list

	tempos.forEach((tempo, tempoIndex)=>{
		tempo.bpm = 60000000/tempo.value
		tempo.bpmChange = tempo[tempoIndex-1] ? getBpmChange(tempo.bpm, tempo[tempoIndex-1].bpm) : 0
	})

	let curTempoIndex = 0
	let tempo = tempos[curTempoIndex]
	let prevTempo = tempos[curTempoIndex]
	let curEventIndex = 0
	let event = events[curEventIndex]
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
			page.tempos.push()
		}
		while (tempo && page.end_tick > tempo.tick) {
			page.tempos.push(tempo)
			tempo.page = page
			prevTempo = tempo
			tempo = tempos[++curTempoIndex]
		}

		page.events = []
		while (event && page.end_tick > event.tick) {
			page.events.push(event)
			event.page = page
			// console.log(page.id, page.end_tick, event.tick, event.event_list)
			event = events[++curEventIndex]
		}

		page.notes = []
	})

	notes.forEach((note)=>{
		note.end_tick = note.tick + note.hold_tick

		if (note.next_id > 0) note.next = notes.find(next=>next.id === note.next_id)

		let page = pages.find(page=>page.id === note.page_index)
		if (note.is_forward) page = page.prev
		note.page = page
		note.page.notes.push(note)
		note.this_tick = note.tick - note.page.start_tick
		note.beat = note.this_tick % data.time_base

		note.xPos = margin.side + noteAreaWidth * note.x
		note.yPos = yPos(page.dir, (note.tick-page.start_tick) / page.delta)
	})

	notes.forEach((note)=>{
		if (!note.hold_tick) return
		// find end tick position and page
		let thisPage = note.page
		while(thisPage.next && thisPage.next.start_tick < note.end_tick)
			thisPage = thisPage.next
		note.end_page = thisPage
		note.endYPos = yPos(thisPage.dir, (note.end_tick-thisPage.start_tick) / thisPage.delta)
	})
}

function drawGroupLine(ctx, group, base) {
	if (group.arr.length < 2) return
	let color = "#545454"
	beats.forEach(beat=>{
		if (approx(group.arr[0].beat * beat.div + group.arr[0].page.start_beat,
			base * beat.num, 5 * beat.div))
			color = beat.color
	})
	if (!color) return
	ctx.beginPath()
	ctx.lineWidth = 8
	ctx.setLineDash([])
	ctx.strokeStyle = color
	ctx.moveTo(group.minX, group.yPos)
	ctx.lineTo(group.maxX, group.yPos)
	ctx.stroke()

	ctx.beginPath()
	ctx.lineWidth = 4
	ctx.strokeStyle = '#FFFFFF'
	ctx.moveTo(group.minX, group.yPos + 6)
	ctx.lineTo(group.maxX, group.yPos + 6)
	ctx.stroke()

	ctx.beginPath()
	ctx.moveTo(group.minX, group.yPos - 6)
	ctx.lineTo(group.maxX, group.yPos - 6)
	ctx.stroke()
}

function drawPage(page, isNext, base) {
	let canvas = createCanvas(canvasWidth, canvasHeight)
	let ctx = canvas.getContext('2d')
	let notes = page.notes.slice().reverse()
	let group = { tick: -1, arr: [], minX: canvasWidth, maxX: 0, flag: false }
	notes.forEach(note=>{
		if (note.type === 2) drawTail(note, page, ctx)
		if (note.type === 1) drawTail(note, page, ctx)
		if (note.next_id > 0) drawLink(note, ctx)
		if (!isNext && note.type !== 4 && note.type !== 7)
		// if (!isNext)
			drawNoteLine(note, ctx, base, page.start_beat)
		// draw siblings
		if (note.has_sibling) {
			if(note.tick !== group.tick && group.flag) { // handle existing group
				drawGroupLine(ctx, group, base)
				group = { tick: -1, arr: [], minX: canvasWidth, maxX: 0, flag: false }
			}
			// same group
			if (note.type !== 4 && note.type !== 7) {
				group.yPos = note.yPos
				group.tick = note.tick
				group.arr.push(note)
				group.minX = Math.min(group.minX, note.xPos)
				group.maxX = Math.max(group.maxX, note.xPos)
			}
			group.flag = true
		} else if (group.flag) { // handle existing group
			drawGroupLine(ctx, group, base)
			group = { tick: -1, arr: [], minX: canvasWidth, maxX: 0, flag: false }
		}
	})
	if (group.flag) drawGroupLine(ctx, group, base)
	notes.forEach(note=>{ drawNote(note, ctx, (page.dir < 0) ? 'down' : 'up') })
	return canvas
}

function processData(data, path, pageNum) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)

	preprocess(data)

	let longHolds = []
	data.page_list.forEach((page)=>{
		if (page.id >= pageNum) return
		let canvas = createCanvas(canvasWidth, canvasHeight)
		let ctx = canvas.getContext('2d')

		// initial canvas
		let initBpm = page.tempos[0].bpm
		let prevBpm = page.prev ? page.prev.tempos[page.prev.tempos.length-1].bpm : initBpm
		let lastBpm = page.tempos[page.tempos.length-1].bpm
		let nextBpm = page.next ? page.next.tempos[0].bpm : lastBpm
		let bpmChange = getBpmChange(initBpm, prevBpm)
		let lineSpeedChange = page.prev ? getBpmChange(initBpm/page.beats, prevBpm/page.prev.beats) : 0
		let nextLineSpeedChange = page.next ? getBpmChange(nextBpm/page.next.beats, lastBpm/page.beats) : 0
		initCanvas(ctx, page, bpmChange)

		// draw next page
		if (page.next) {
			ctx.globalAlpha = 0.3
			if (nextLineSpeedChange) drawDirection(ctx, page.next, nextLineSpeedChange)
			ctx.globalAlpha = 0.15
			ctx.drawImage(drawPage(page.next, true, data.time_base), 0, 0)
			ctx.globalAlpha = 1
		}

		// draw tempo changes, direction and beat lines
		drawBeatLines(ctx, page)
		drawTempoChange(ctx, page, bpmChange)
		drawDirection(ctx, page, lineSpeedChange)

		// Draw existing long holds
		let newLongHolds = page.notes.filter(note=>note.type === 2).reverse().concat(longHolds)
		newLongHolds.forEach(longHold=>{ drawTail(longHold, page, ctx) })
		longHolds.forEach(longHold=>{ drawNote(longHold, ctx, (longHold.page.dir < 0) ? 'down' : 'up', true) })
		longHolds = newLongHolds.filter(longHold=>longHold.end_tick > page.end_tick)

		// draw this page
		ctx.drawImage(drawPage(page, false, data.time_base), 0, 0)

		prevBpm = page.tempos[page.tempos.length-1].bpm

		// write to file
		fs.writeFileSync(`${path}/${`${page.id}`.padStart(3, '0')}.png`, canvas.toBuffer())
	})
}

module.exports = {
	loadAssets: loadAssets,
	processData: processData
}