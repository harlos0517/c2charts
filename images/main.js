const fs = require('fs')
const { createCanvas, loadImage, registerFont } = require('canvas')
const assert = require('assert')

const characters = require('./songs.json')

const width = 1920
const height = 1440
const margin = {
	'top': 180,
	'bottom' : 140,
	'side' : 100
}
const noteAreaWidth = width - 2 * margin.side
const noteAreaHeight = height - margin.top - margin.bottom
const noteRatio = 0.8

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

function drawBeatLine(ctx, dir, ratio, color) {
	let y = yPos(dir, ratio)
	ctx.lineWidth = 1
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

	let grdStart = (dir === 1) ? (margin.top + noteAreaHeight     ) : (margin.top     )
	let grdEnd   = (dir === 1) ? (margin.top + noteAreaHeight - 40) : (margin.top + 40)
	let grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd);
	grd.addColorStop(0, `#909090FF`)
	grd.addColorStop(1, `#90909000`)
	ctx.fillStyle = grd
	ctx.fillRect(0, (dir === 1) ? grdEnd : grdStart, width, 40)

	for (let beat = 0; beat <= beats; beat++) {
		drawBeatLine(ctx, dir, beat/beats, '#C7C7C7')
		if (beat+0.5000 <= beats) drawBeatLine(ctx, dir, (beat+0.5000)/beats, '#787878')
		if (beat+0.2500 <= beats) drawBeatLine(ctx, dir, (beat+0.2500)/beats, '#323232')
		if (beat+0.7500 <= beats) drawBeatLine(ctx, dir, (beat+0.7500)/beats, '#323232')
		if (beat+0.1667 <= beats) drawBeatLine(ctx, dir, (beat+0.1667)/beats, '#003254')
		if (beat+0.3333 <= beats) drawBeatLine(ctx, dir, (beat+0.3333)/beats, '#003254')
		if (beat+0.6667 <= beats) drawBeatLine(ctx, dir, (beat+0.6667)/beats, '#003254')
		if (beat+0.8333 <= beats) drawBeatLine(ctx, dir, (beat+0.8333)/beats, '#003254')
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
	for (let point = verPos; point<verPosEnd; point += longHoldTail.height*noteRatio-1) {
		ctx.drawImage(longHoldTail,
			horPos - longHoldTail.width*noteRatio/2, point,
			longHoldTail.width*noteRatio, Math.min(longHoldTail.height*noteRatio, verPosEnd - point)
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

function drawNote(note, page, ctx) {
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

	let horPos = margin.side + noteAreaWidth * note.x
	let verPos = yPos(page.scan_line_direction, (note.tick-page.start_tick) / (page.end_tick-page.start_tick))
	ctx.drawImage(noteObj,
		horPos - noteObj.width *noteRatio/2,
		verPos - noteObj.height*noteRatio/2,
		noteObj.width*noteRatio, noteObj.height*noteRatio
	)
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
	console.time(`Written to ${path}`)

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
		ctx.globalAlpha = 0.15
		nextNotes.forEach(note=>{
			if (note.type === 2) drawLongHoldTail(note, page_list[page_index+1], ctx)
		})
		nextNotes.forEach(note=>{
			if (note.type === 1) drawHoldTail(note, page_list[page_index+1], ctx)
			if (note.next_id > 0) {
				let nextNote = note_list[note.next_id]
				let nextPage = page_list[nextNote.page_index]
				drawLink(note, page_list[page_index+1], nextNote, nextPage, ctx)
			}
		})
		nextNotes.forEach(note=>{ drawNote(note, page_list[page_index+1], ctx) })
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
		})
		notes.forEach(note=>{ drawNote(note, page, ctx) })

		fs.writeFileSync(`${path}/${`${page_index}`.padStart(3, '0')}.png`, canvas.toBuffer())
		//console.log(`Written to ${path}/${page_index}.png`)
	})

	console.timeEnd(`Written to ${path}`)
}


function processChart(song, difficulty_id, character, path) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)
	let data = require(`./data/${character.id}_${song.id}_${difficulty_id}_decrypted.json`)

	// check completeness (disable this line to restart totally)
	let complete = true
	for (let page_index = 0; page_index < data.page_list.length; page_index++) {
		if (!fs.existsSync(`${path}/${`${page_index}`.padStart(3, '0')}.png`)) {
			processData(data, path)
			break
		}
	}
}

function processSong(song, character, path) {
	if(song.level.easy  ) processChart(song, 0, character, `${path}/easy`  )
	if(song.level.hard  ) processChart(song, 1, character, `${path}/hard`  )
	if(song.level.chaos ) processChart(song, 2, character, `${path}/chaos` )
	if(song.level.glitch) processChart(song, 3, character, `${path}/glitch`)
}

function process() {
	loadAssets(()=>{
		characters.forEach(character=>{
			// Check directory existance
			if (!fs.existsSync(`output/${character.id}`))
				fs.mkdirSync(`output/${character.id}`)
			character.songs.forEach(song=>{
				// Check directory existance
				if (!fs.existsSync(`output/${character.id}/${song.id}`))
					fs.mkdirSync(`output/${character.id}/${song.id}`)

				console.log(`[ Process Song ] ${character.name} - ${song.name}`)
				processSong(song, character, `output/${character.id}/${song.id}`)
			})
		})
	})
}

process()