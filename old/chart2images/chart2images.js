const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')

const canvasWidth = 1920
const canvasHeight = 1440
const margin = {
	'top': 240,
	'bottom' : 140,
	'side' : 100
}
const noteAreaWidth = canvasWidth - 2 * margin.side
const noteAreaHeight = canvasHeight - margin.top - margin.bottom
const noteRatio = 1
const scale = .5

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
	fonts.forEach(font=>{ registerFont('assets/fonts/' + font.src, { family: font.family }) })
	let promises = []
	noteTypes.forEach(noteType=>{
		promises.push = loadImage('assets/img/' + noteType.up  .src).then(image=>{ noteType.up  .image = image })
		promises.push = loadImage('assets/img/' + noteType.down.src).then(image=>{ noteType.down.image = image })
		if (noteType.tail) {
			let tail = noteType.tail
			promises.push = loadImage('assets/img/' + tail.src).then(image=>{ tail.image = image })
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

function writeBpm(ctx, bpm, x, y, fontSize, align) {
	let [int, dec] = bpm.toFixed(2).split('.');
	ctx.textAlign = 'center'
	let xn
	if (align === 'right') {
		xn = writeText(ctx, dec, x, y, align, fontSize)
		xn = writeText(ctx, '.', xn+fontSize*0.2, y, align, fontSize)
		xn = writeText(ctx, int, xn+fontSize*0.2, y, align, fontSize)
	} else {
		xn = writeText(ctx, int, x, y, align, fontSize)
		xn = writeText(ctx, '.', xn-fontSize*0.2, y, align, fontSize)
		xn = writeText(ctx, dec, xn-fontSize*0.2, y, align, fontSize)
	}
	return xn
}

function initCanvas(ctx, page) {
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
	writeText(ctx, page.id.toString().padStart(3, '0'), canvasWidth / 2 - fontSize * .9, fontSize, 'left', fontSize)

	// BPM
	fontSize = 80
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'right'
	ctx.fillStyle = '#FFFFFF'
	ctx.fillText('BPM', canvasWidth - fontSize*.2, fontSize)

	// SCANLINE
	fontSize = 80
	ctx.font = `${fontSize}px "Rajdhani"`
	ctx.textAlign = 'left'
	ctx.fillStyle = '#FFFFFF'
	ctx.fillText('SCANLINE', fontSize*.2, fontSize)
}

function getBpmChange(a, b) {
	return Math.log2(a) - Math.log2(b)
}

function drawTempoChange(ctx, page, initBpmChange, lineSpeedChange) {
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
		let start = yPos(page.direction, (tempo.tick - page.start_tick) / page.delta)
		let end = yPos(page.direction, tempos[tempoIndex+1] ? ((tempos[tempoIndex+1].tick - page.start_tick) / page.delta) : 1)
		if (start > end) [start, end] = [end, start]
		ctx.fillRect(0, start, canvasWidth, end - start)
	})
	let y = (page.direction > 0) ? canvasHeight : 0
	tempos.forEach((tempo, tempoIndex, tempos)=>{
		let bpmChange = tempoIndex ? getBpmChange(tempo.bpm, initBpm) : initBpmChange
		let lineChange = tempoIndex ? bpmChange : lineSpeedChange
		let fontSize = 60
		ctx.font = `${fontSize}px "Rajdhani"`
		let start = yPos(page.direction, (tempo.tick - page.start_tick) / page.delta)
		let end = yPos(page.direction, tempos[tempoIndex+1] ? ((tempos[tempoIndex+1].tick - page.start_tick) / page.delta) : 1)
		if (start > end) [start, end] = [end, start]
		y = (page.direction > 0) ? Math.min(y, end - fontSize*.2) : Math.max(y, start + fontSize)
		let color = '#FFFFFF'
		if (bpmChange > 0) color = '#FF8888'
		if (bpmChange < 0) color = '#88FFBB'
		ctx.fillStyle = color
		writeBpm(ctx, tempo.bpm, canvasWidth - fontSize*.2, y, fontSize, 'right')
		color = '#FFFFFF'
		if (lineChange > 0) color = '#FF8888'
		if (lineChange < 0) color = '#88FFBB'
		ctx.fillStyle = color
		writeBpm(ctx, tempo.bpm / page.beats, fontSize*.2, y, fontSize, 'left')
		y -= fontSize * page.direction
	})
}

function drawDirection(ctx, page, lineSpeedChange) {
	let thickness = 80
	let grdStart = margin.top + ((page.direction > 0) ?  noteAreaHeight : 0)
	let grdEnd   = margin.top + ((page.direction > 0) ? (noteAreaHeight - thickness) : thickness)
	let grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd);
	let color = '#FFFFFF'
	if (lineSpeedChange > 0) color = '#FF8888'
	if (lineSpeedChange < 0) color = '#88FFBB'
	ctx.fillStyle = color
	grd.addColorStop(0, `${color}90`)
	grd.addColorStop(1, `${color}00`)
	ctx.fillStyle = grd
	ctx.fillRect(0, (page.direction > 0) ? grdEnd : grdStart, canvasWidth, thickness)
}

function drawBeatLines(ctx, page) {
	beats.forEach(beat=>{
		if (!beat.global) return
		for (let beatInt = 0; ; beatInt++) {
			let curBeat = beatInt + beat.num/beat.div + page.start_beat
			if (curBeat < 0) continue
			if (curBeat > page.beats) break
			drawBeatLine(ctx, yPos(page.direction, curBeat/page.beats), beat.color, beat.lineWidth)
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

	let start = (page === note.page) ? note.yPos : ((page.direction > 0) ? bottom : top)
	let end = (page === note.end_page) ? note.endYPos : ((page.direction > 0) ? top : bottom)
	if (page.direction > 0) [ start, end ] = [ end, start ]
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
	if (!note.next) return (note.page.direction > 0) ? Math.PI/2 : -Math.PI/2
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
	const { pages, tempos, events, notes } = data

	pages.forEach((p, p_i)=>{
		p.next = pages[p_i+1]
		p.prev = pages[p_i-1]
		p.tempos = p.tempo_ids.map(id => tempos[id])
		p.events = p.event_ids.map(id => events[id])
		p. notes = p. note_ids.map(id =>  notes.find(x => x.id === id))
	})

	notes.forEach(note=>{
		note.    page = pages.find(p => p.id === note.    page_id)
		note.next = notes[note.next_id]
		note.xPos = margin.side + noteAreaWidth * note.x
		note.yPos = yPos(note.page.direction, (note.tick - note.page.start_tick) / note.page.delta)
		if (!note.hold_tick) return
		note.end_page = pages.find(p => p.id === note.end_page_id)
		note.endYPos = yPos(note.end_page.direction, (note.end_tick - note.end_page.start_tick) / note.end_page.delta)
		// console.log(note.end_tick - note.end_page.start_tick)
	})

	tempos.forEach(tempo=>{
		tempo.page = pages.find(p => p.id === tempo.page_id)
	})

	events.forEach(event=>{
		event.page = pages.find(p => p.id === event.page_id)
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
	notes.forEach(note=>{ drawNote(note, ctx, (page.direction < 0) ? 'down' : 'up') })
	return canvas
}

function processData(data, path, pageNum, page_id) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)

	preprocess(data)

	let longHolds = []
	let targetBuffer = null
	let flag = false
	data.pages.forEach((page, page_i)=>{
		if (pageNum && page.id >= pageNum || flag) return
		if (String(page_i) !== page_id) {
			let newLongHolds = page.notes.filter(note=>note.type === 2).reverse().concat(longHolds)
			longHolds = newLongHolds.filter(longHold=>longHold.end_tick > page.end_tick)
			return
		}
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
		initCanvas(ctx, page)

		// draw next page
		if (page.next) {
			ctx.globalAlpha = 0.3
			if (nextLineSpeedChange) drawDirection(ctx, page.next, nextLineSpeedChange)
			ctx.globalAlpha = 0.15
			ctx.drawImage(drawPage(page.next, true, data.time_base), 0, 0)
			ctx.globalAlpha = 1
		}

		// draw direction and beat lines
		drawBeatLines(ctx, page)
		drawDirection(ctx, page, lineSpeedChange)

		// Draw existing long holds
		let newLongHolds = page.notes.filter(note=>note.type === 2).reverse().concat(longHolds)
		newLongHolds.forEach(longHold=>{ drawTail(longHold, page, ctx) })
		longHolds.forEach(longHold=>{ drawNote(longHold, ctx, (longHold.page.direction < 0) ? 'down' : 'up', true) })
		longHolds = newLongHolds.filter(longHold=>longHold.end_tick > page.end_tick)

		// draw this page
		ctx.drawImage(drawPage(page, false, data.time_base), 0, 0)

		prevBpm = page.tempos[page.tempos.length-1].bpm

		// draw tempo changes
		drawTempoChange(ctx, page, bpmChange, lineSpeedChange)
	
		// write to file
		let finalCanvas = createCanvas(canvasWidth*scale, canvasHeight*scale)
		let finalCtx = finalCanvas.getContext('2d')
		finalCtx.scale(scale, scale)
		finalCtx.drawImage(canvas, 0, 0)
		targetBuffer = finalCanvas.toBuffer()
		flag = true
		// fs.writeFileSync(`${path}/${`${page.id}`.padStart(3, '0')}.png`, finalCanvas.toBuffer())
	})
	return targetBuffer
}

module.exports = { loadAssets, processData }