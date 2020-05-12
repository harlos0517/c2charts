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
	src: 'note.png',
},{
	name: 'hold',
	src: 'hold.png',
	tail: { src: 'hold_tail.png'}
},{
	name: 'long hold',
	src: 'long_hold.png',
	tail: { src: 'long_hold_tail.png'}
},{
	name: 'chain head',
	src: 'chain_head.png',
},{
	name: 'chain',
	src: 'chain.png',
},{
	name: 'flick',
	src: 'flick.png',
},{
	name: 'drag head',
	src: 'note.png',
},{
	name: 'drag',
	src: 'chain.png',
}]

const beats = [
	{ num: 0, div: 1, color: '#C7C7C7', lineWidth: 4, global: true  },
	{ num: 1, div: 2, color: '#787878', lineWidth: 3, global: true  },
	{ num: 1, div: 3, color: '#0078A2', lineWidth: 2, global: false },
	{ num: 2, div: 3, color: '#0078A2', lineWidth: 2, global: false },
	{ num: 1, div: 4, color: '#787878', lineWidth: 2, global: false },
	{ num: 3, div: 4, color: '#787878', lineWidth: 2, global: false },
	{ num: 1, div: 6, color: '#005486', lineWidth: 1, global: false },
	{ num: 5, div: 6, color: '#005486', lineWidth: 1, global: false },
	{ num: 1, div: 8, color: '#545454', lineWidth: 1, global: false },
	{ num: 3, div: 8, color: '#545454', lineWidth: 1, global: false },
	{ num: 5, div: 8, color: '#545454', lineWidth: 1, global: false },
	{ num: 7, div: 8, color: '#545454', lineWidth: 1, global: false }
]

function loadAssets(){
	fonts.forEach(font=>{ registerFont(font.src, { family: font.family }) })
	let promises = []
	noteTypes.forEach(noteType=>{
		promises.push = loadImage(noteType.src).then(image=>{ noteType.image = image })
		if (noteType.tail) {
			let tail = noteType.tail
			promises.push = loadImage(tail.src).then(image=>{ tail.image = image })
		}
	})
	return Promise.all(promises)
}

function yPos(dir, ratio) {
	let verDist = noteAreaHeight * ratio
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
	let fontSize = 60
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'center'
	ctx.fillStyle = '#FFFFFF'
	writeText(ctx, page.id.toString().padStart(3, '0'), fontSize*.2, fontSize, 'left', fontSize)

	// BPM
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'center'
	let x, x2
	let bpm  = page.tempos[0].bpm
	let color = '#FFFFFF'
	if (bpmChange > 0) color = '#FF8888'
	if (bpmChange < 0) color = '#88FFBB'
	ctx.fillStyle = color
	x = writeBpm(ctx, bpm, canvasWidth - fontSize*.2, fontSize, fontSize)
	if (page.tempos.length > 1) {
		let bpm2 = page.tempos[page.tempos.length-1].bpm;
		ctx.fillStyle = '#FFFFFF'
		if (bpm2 > bpm) ctx.fillStyle = '#FF8888'
		if (bpm2 < bpm) ctx.fillStyle = '#88FFBB'
		x2 = writeBpm(ctx, bpm2, canvasWidth - fontSize*.2, fontSize*2, fontSize)
	}
	let min = x2 ? Math.min(x, x2) : x;
	ctx.fillStyle = '#FFFFFF'
	writeText(ctx, 'BPM', min-fontSize*.4, fontSize, 'right', fontSize)
}

function drawTempoChange(ctx, page) {
	let tempos = page.tempos
	let initBpm = tempos[0].bpm
	tempos.forEach((tempo, tempoIndex, tempos)=>{
		let bpmChange = Math.log2(tempo.bpm) - Math.log2(initBpm)
		let hex = Math.min(192, Math.round(Math.abs(255 * bpmChange))).toString(16).padStart(2,'0')
		let color
		     if (bpmChange > 0) color = `#FF0000${hex}`
		else if (bpmChange < 0) color = `#00FF66${hex}`
		else return
		let start = yPos(page.dir, (tempo.tick - page.start_tick) / page.delta)
		let end   = yPos(page.dir, tempos[tempoIndex+1] ? (tempos[tempoIndex+1].tick - page.start_tick) / page.delta : 1)
		if (start < end) [start, end] = [end, start]
		ctx.fillStyle = color
		ctx.fillRect(0, start, canvasWidth, end - start)
	})
}

function drawDirection(ctx, page, bpmChange) {
	let thickness = 80
	let grdStart = margin.top + ((page.dir > 0) ?  noteAreaHeight : 0)
	let grdEnd   = margin.top + ((page.dir > 0) ? (noteAreaHeight - thickness) : thickness)
	let grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd);
	let color = '#FFFFFF'
	if (bpmChange > 0) color = '#FF8888'
	if (bpmChange < 0) color = '#88FFBB'
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
			let curBeat = beatInt + beat.num/beat.div
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

function drawNoteLine(note, ctx, base) {
	if (note.type === 4 || note.type === 7) return
	let length = 300
	if (note.type === 5) length = 450
	let color
	beats.forEach(beat=>{
		if (!beat.global && approx(note.beat * beat.div, base * beat.num, 5 * beat.div))
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
	ctx.strokeStyle = '#BAADCB'
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

function drawNote(note, ctx, shrink) {
	if (!noteTypes[note.type]) return console.log('Unknown note type')
	let noteObj = noteTypes[note.type].image
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

	tempos.forEach(tempo=>{
		tempo.bpm = 60000000/tempo.value
	})

	let curTempoIndex = 0
	let tempo = tempos[curTempoIndex]
	let prevTempo = tempos[curTempoIndex]
	let curEventIndex = 0
	let event = events[curEventIndex]
	pages.forEach((page, page_index)=>{
		page.dir = page.scan_line_direction
		page.id = page_index
		page.delta = page.end_tick - page.start_tick
		page.next = pages[page_index+1]
		page.beats = page.delta / data.time_base

		page.tempos = []
		if (!tempo || page.start_tick < tempo.tick)
			page.tempos.push(prevTempo)
		while (tempo && page.end_tick > tempo.tick) {
			page.tempos.push(tempo)
			tempo.page = page
			prevTempo = tempo
			tempo = tempos[++curTempoIndex]
		}

		page.events = []
		if (event && page.end_tick >= event.tick) {
			page.events.push(event)
			event.page = page
			event = events[++curEventIndex]
		}

		page.notes = []
	})

	notes.forEach((note)=>{
		note.end_tick = note.tick + note.hold_tick

		if (note.next_id > 0) note.next = notes.find(next=>next.id === note.next_id)

		let page = note.page = pages.find(page=>page.id === note.page_index)
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

function drawPage(page, isNext, base) {
	let canvas = createCanvas(canvasWidth, canvasHeight)
	let ctx = canvas.getContext('2d')
	let notes = page.notes.slice().reverse()
	notes.forEach(note=>{
		if (note.type === 2) drawTail(note, page, ctx)
		if (note.type === 1) drawTail(note, page, ctx)
		if (note.next_id > 0) drawLink(note, ctx)
		if (!isNext && note.type !== 4 && note.type !== 7)
			drawNoteLine(note, ctx, base)
	})
	notes.forEach(note=>{ drawNote(note, ctx) })
	return canvas
}

function processData(data, path) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)

	preprocess(data)

	let longHolds = []
	let prevBpm = data.page_list[0].tempos[0].bpm
	data.page_list.forEach((page)=>{
		let canvas = createCanvas(canvasWidth, canvasHeight)
		let ctx = canvas.getContext('2d')

		// initial canvas
		let bpmChange = page.tempos[0].bpm - prevBpm
		initCanvas(ctx, page, bpmChange)

		// draw next page
		if (page.next) {
			ctx.globalAlpha = 0.15
			ctx.drawImage(drawPage(page.next, true, data.time_base), 0, 0)
			ctx.globalAlpha = 1
		}

		// draw tempo changes, direction and beat lines
		drawBeatLines(ctx, page)
		drawTempoChange(ctx, page)
		drawDirection(ctx, page, bpmChange)

		// Draw existing long holds
		let newLongHolds = page.notes.filter(note=>note.type === 2).reverse().concat(longHolds)
		newLongHolds.forEach(longHold=>{ drawTail(longHold, page, ctx) })
		longHolds.forEach(longHold=>{ drawNote(longHold, ctx, true) })
		longHolds = newLongHolds.filter(longHold=>longHold.end_tick > page.end_tick)

		// draw this page
		ctx.drawImage(drawPage(page, false, data.time_base), 0, 0)

		prevBpm = page.tempos[0].bpm

		// write to file
		fs.writeFileSync(`${path}/${`${page.id}`.padStart(3, '0')}.png`, canvas.toBuffer())
	})
}

module.exports = {
	loadAssets: loadAssets,
	processData: processData
}