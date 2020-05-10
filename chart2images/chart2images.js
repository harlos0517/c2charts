const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')
const assert = require('assert')

const width = 1920
const height = 1440
const margin = {
	'top': 180,
	'bottom' : 140,
	'side' : 100
}
const noteAreaWidth = width - 2 * margin.side
const noteAreaHeight = height - margin.top - margin.bottom
const noteRatio = 1

var noteType = {}

function loadAssets(callback){
	registerFont('Rajdhani-SemiBold.ttf', { family: 'Rajdhani' })
	loadImage('note.png').then(note=>{
		noteType.note = note
		return loadImage('long_hold.png')
	}).then(longHold => {
		noteType.longHold = longHold
		return loadImage('hold_tail.png')
	}).then(longHoldTail => {
		noteType.longHoldTail = longHoldTail
		return loadImage('hold.png')
	}).then(hold => {
		noteType.hold = hold
		return loadImage('flick.png')
	}).then(flick=>{
		noteType.flick = flick
		return loadImage('chain_head.png')
	}).then(chainHead=>{
		noteType.chainHead = chainHead
		return loadImage('chain.png')
	}).then(chain=>{
		noteType.chain = chain
		callback()
	})
}

function yPos(dir, ratio) {
	let verDist = noteAreaHeight * ratio
	return (dir === 1) ? (margin.top + noteAreaHeight - verDist) : (margin.top + verDist)
}

function drawBeatLine(ctx, dir, ratio, color, lineWidth) {
	let y = yPos(dir, ratio)
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = color
	ctx.beginPath()
	ctx.moveTo(0, y)
	ctx.lineTo(width, y)
	ctx.stroke()
}

function initCanvas(ctx, page, data, tempo) {
	ctx.fillStyle = '#191919'
	ctx.fillRect(0, 0, width, height)
	ctx.fillStyle = '#060606'
	ctx.fillRect(0, margin.top, width, noteAreaHeight)

	ctx.font = '60px "Rajdhani"'
	ctx.fillStyle = '#FFFFFF'
	ctx.textAlign = 'center'
	let temp = `${page.id}`.padStart(3, '0').split('').forEach((ch,i)=>{
		ctx.fillText(ch, 30+35*i, 60)
	})
	temp = ('BPM ' + `${tempo.toFixed(2)}`.padStart(6, '0')).split('').reverse().forEach((ch,i)=>{
		let x = width-30-35*i
		if (i === 2) x += 10
		if (i  >  2) x += 20
		ctx.fillText(ch, x, 60)
	})

	let beats = (page.end_tick - page.start_tick) / data.time_base
	let dir = page.scan_line_direction

	let thickness = 75
	let grdStart = (dir === 1) ? (margin.top + noteAreaHeight            ) : (margin.top            )
	let grdEnd   = (dir === 1) ? (margin.top + noteAreaHeight - thickness) : (margin.top + thickness)
	let grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd);
	grd.addColorStop(0, `#909090FF`)
	grd.addColorStop(1, `#90909000`)
	ctx.fillStyle = grd
	ctx.fillRect(0, (dir === 1) ? grdEnd : grdStart, width, thickness)

	for (let beat = 0; beat <= beats; beat++) {
		drawBeatLine(ctx, dir, beat/beats, '#C7C7C7', 4)
		if (beat+0.5000 <= beats) drawBeatLine(ctx, dir, (beat+0.5000)/beats, '#787878', 1)
		// if (beat+0.2500 <= beats) drawBeatLine(ctx, dir, (beat+0.2500)/beats, '#323232', 2)
		// if (beat+0.7500 <= beats) drawBeatLine(ctx, dir, (beat+0.7500)/beats, '#323232', 2)
		// if (beat+0.1667 <= beats) drawBeatLine(ctx, dir, (beat+0.1667)/beats, '#003254', 1)
		// if (beat+0.3333 <= beats) drawBeatLine(ctx, dir, (beat+0.3333)/beats, '#005486', 2)
		// if (beat+0.6667 <= beats) drawBeatLine(ctx, dir, (beat+0.6667)/beats, '#005486', 2)
		// if (beat+0.8333 <= beats) drawBeatLine(ctx, dir, (beat+0.8333)/beats, '#003254', 1)
	}
}

function drawHoldTail(note, page, ctx) {
	let horPos = margin.side + noteAreaWidth * note.x
	let dir = page.scan_line_direction
	let verPos    = yPos(dir, (note.tick               -page.start_tick) / (page.end_tick-page.start_tick))
	let verPosEnd = yPos(dir, (note.tick+note.hold_tick-page.start_tick) / (page.end_tick-page.start_tick))
	ctx.beginPath()
	ctx.lineWidth = 80 * noteRatio
	ctx.setLineDash([10 * noteRatio, 18 * noteRatio])
	ctx.strokeStyle = '#FFFFFF'
	ctx.moveTo(horPos, verPos)
	ctx.lineTo(horPos, verPosEnd)
	ctx.stroke()
	ctx.beginPath()
	ctx.moveTo(horPos, verPosEnd)
	ctx.lineTo(horPos, verPosEnd + ((dir === 1) ? 10 : -10)) * noteRatio
	ctx.stroke()
}

function drawLongHoldTail(note, page, ctx) {
	let horPos = margin.side + noteAreaWidth * note.x
	let dir = page.scan_line_direction
	let verPos    = yPos(dir, Math.max(0, (note.tick               -page.start_tick) / (page.end_tick-page.start_tick)))
	let verPosEnd = yPos(dir, Math.min(1, (note.tick+note.hold_tick-page.start_tick) / (page.end_tick-page.start_tick)))
	let longHoldTail = noteType.longHoldTail

	if (dir === 1) [verPos, verPosEnd] = [verPosEnd, verPos]
	for (let point = verPos; point<verPosEnd; point += longHoldTail.height*.8*noteRatio) {
		ctx.drawImage(longHoldTail,
			horPos - longHoldTail.width*.8*noteRatio/2, point,
			longHoldTail.width*.8*noteRatio, Math.min(longHoldTail.height*.8*noteRatio, verPosEnd - point)
		)
	}
}

function drawLongHoldPoint(note, ctx) {
	let page = note.page
	let noteObj = noteType.longHold
	let horPos = margin.side + noteAreaWidth * note.x
	let verPos = yPos(page.scan_line_direction, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))
	ctx.drawImage(noteObj,
		horPos - noteObj.width *noteRatio*0.8/2,
		verPos - noteObj.height*noteRatio*0.8/2,
		noteObj.width*noteRatio*0.8, noteObj.height*noteRatio*0.8
	)
}

function approx(a, b, err) {
	return (Math.abs(a - b) < err)
}

function drawNoteLine(note, page, ctx, base) {
	let horPos = margin.side + noteAreaWidth * note.x
	let verPos = yPos(page.scan_line_direction, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))
	let tick = (note.tick-page.start_tick) % base
	let length = (note.type === 4 || note.type === 7) ? 150 : ((note.type === 5) ? 400 : 300)
	let color
	     if (approx(tick*2, base  , 10)) color = '#787878'
	else if (approx(tick*3, base  , 15) || approx(tick*3, base*2, 15)) color = '#0078A2'
	else if (approx(tick*4, base  , 20) || approx(tick*4, base*3, 20)) color = '#787878'
	else if (approx(tick*6, base  , 30) || approx(tick*6, base*5, 30)) color = '#003254'
	else if (approx(tick*8, base*1, 40) || approx(tick*8, base*3, 40)) color = '#323232'
	else if (approx(tick*8, base*5, 40) || approx(tick*8, base*7, 40)) color = '#323232'
	else return
	ctx.beginPath()
	ctx.lineWidth = 4
	ctx.strokeStyle = color
	ctx.setLineDash([])
	ctx.moveTo(horPos - length/2, verPos)
	ctx.lineTo(horPos + length/2, verPos)
	ctx.stroke()
}

function getRotate(note, page, nextNote, nextPage) {
	let horPos = margin.side + noteAreaWidth * note.x
	let verPos = yPos(page.scan_line_direction, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))
	let nextHorPos = margin.side + noteAreaWidth * nextNote.x
	let nextVerPos = yPos(nextPage.scan_line_direction, (nextNote.tick-nextPage.start_tick) / (nextPage.end_tick-nextPage.start_tick))
	let dx = nextHorPos - horPos
	let dy = nextVerPos - verPos
	return Math.atan2(dx, -dy)
}

function drawNote(note, page, ctx, rotate) {
	let noteObj = noteType.notes
	     if (note.type === 0) noteObj = noteType.note
	else if (note.type === 1) noteObj = noteType.hold
	else if (note.type === 2) noteObj = noteType.longHold
	else if (note.type === 3) noteObj = noteType.chainHead
	else if (note.type === 4) noteObj = noteType.chain
	else if (note.type === 5) noteObj = noteType.flick
	else if (note.type === 6) noteObj = noteType.note
	else if (note.type === 7) noteObj = noteType.chain
	else console.log('Unknown note type')

	let ratio = (note.type === 4 || note.type === 7) ? 0.6 : 1
	let horPos = margin.side + noteAreaWidth * note.x
	let verPos = yPos(page.scan_line_direction, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))

	if (rotate) {
		ctx.save()
		ctx.translate(horPos, verPos)
		ctx.rotate(rotate)
		ctx.translate(-noteObj.width*noteRatio*ratio/2, -noteObj.height*noteRatio*ratio/2)
		ctx.drawImage(noteObj, 0, 0, noteObj.width*noteRatio*ratio, noteObj.height*noteRatio*ratio)
		ctx.restore()
	} else {
		ctx.drawImage(noteObj, 
			horPos - noteObj.width *noteRatio*ratio/2,
			verPos - noteObj.height*noteRatio*ratio/2,
			noteObj.width*noteRatio*ratio, noteObj.height*noteRatio*ratio
		)
	}
}

function drawLink(note, page, nextNote, nextPage, ctx) {
	let horPos = margin.side + noteAreaWidth * note.x
	let dir = page.scan_line_direction
	let verPos = yPos(dir, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))
	let nextHorPos = margin.side + noteAreaWidth * nextNote.x
	let nextDir = nextPage.scan_line_direction
	let nextVerPos = yPos(nextDir, (nextNote.tick-nextPage.start_tick) / (nextPage.end_tick-nextPage.start_tick))

	ctx.beginPath()
	ctx.lineWidth = 23 * noteRatio
	ctx.setLineDash([9 * noteRatio, 9 * noteRatio])
	ctx.strokeStyle = '#BAADCB'
	ctx.moveTo(horPos, verPos)
	ctx.lineTo(nextHorPos, nextVerPos)
	ctx.stroke()
}

function fetchPage(page_index, note_index, data) {
	let note_list = data.note_list
	let cur_note = note_index
	let arr = []
	while (note_list[cur_note] && note_list[cur_note].page_index === page_index)
		arr.push(note_list[cur_note++])
	return [ arr.reverse(), cur_note ]
}

function processData(data, path) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)

	let cur_note = 0
	let cur_tempo = 0
	let note_list = data.note_list
	let tempo_list = data.tempo_list
	let longHolds = []
	let nextNotes = []

	data.page_list.forEach((page, page_index, page_list)=>{
		let canvas = createCanvas(width, height)
		let ctx = canvas.getContext('2d')

		page.id = page_index
		if (tempo_list[cur_tempo+1] && page.start_tick >= tempo_list[cur_tempo+1].tick) cur_tempo++
		let tempo = 60000000/tempo_list[cur_tempo].value
		initCanvas(ctx, page, data, tempo)

		let newLongHolds = []
		let notes = []
		if (note_list[cur_note]) assert(note_list[cur_note].page_index >= page_index)
		if (page_index === 0) {
			[ notes, cur_note ] = fetchPage(page_index, cur_note, data)
		} else {
			notes = nextNotes
			nextNotes = []
		}
		[ nextNotes, cur_note ] = fetchPage(page_index+1, cur_note, data)
		notes.forEach(note=>{
			if (note.type === 2) {
				note.page = page
				newLongHolds.push(note)
			}
		})

		// draw next page
		let canvas2 = createCanvas(width, height)
		let ctx2 = canvas2.getContext('2d')
		nextNotes.forEach(note=>{
			if (note.type === 2) drawLongHoldTail(note, page_list[page_index+1], ctx2)
		})
		nextNotes.forEach(note=>{
			if (note.type === 1) drawHoldTail(note, page_list[page_index+1], ctx2)
			if (note.next_id > 0) {
				let nextNote = note_list[note.next_id]
				let nextPage = page_list[nextNote.page_index]
				drawLink(note, page_list[page_index+1], nextNote, nextPage, ctx2)
			}
		})
		nextNotes.forEach(note=>{
			let rotate = (note.type === 3) ?
				getRotate(note, page_list[page_index+1], note_list[note.next_id], page_list[note_list[note.next_id].page_index]) - Math.PI/4 : 0
			drawNote(note, page_list[page_index+1], ctx2, rotate)
		})
		ctx.globalAlpha = 0.1
		ctx.drawImage(canvas2, 0, 0)
		ctx.globalAlpha = 1

		// Draw long holds
		newLongHolds = newLongHolds.reverse().concat(longHolds)
		newLongHolds.forEach(longHold=>{ drawLongHoldTail(longHold, page, ctx) })
		   longHolds.forEach(longHold=>{ drawLongHoldPoint(longHold, ctx) })
		longHolds = newLongHolds.filter(longHold=>(longHold.tick+longHold.hold_tick) > page.end_tick)

		// draw this page
		notes.forEach(note=>{
			if (note.type === 1) drawHoldTail(note, page, ctx)
			if (note.next_id > 0) {
				let nextNote = note_list[note.next_id]
				let nextPage = page_list[nextNote.page_index]
				drawLink(note, page, nextNote, nextPage, ctx)
			}
			if (note.type !== 4 && note.type !== 7) drawNoteLine(note, page, ctx, data.time_base)
		})
		notes.forEach(note=>{
			let rotate = (note.type === 3) ?
				getRotate(note, page, note_list[note.next_id], page_list[note_list[note.next_id].page_index]) - Math.PI/4 : 0
			drawNote(note, page, ctx, rotate)
		})

		fs.writeFileSync(`${path}/${`${page_index}`.padStart(3, '0')}.png`, canvas.toBuffer())
		//console.log(`Written to ${path}/${page_index}.png`)
	})
}

module.exports = {
	loadAssets: loadAssets,
	processData: processData
}