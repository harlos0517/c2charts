import { Chart } from '@data/types/chart'
import { RuntimeChart, RuntimeNote, RuntimePage } from '@data/types/runtimeChart'

import { toRunTime } from '@data/runTimeChart'

const canvasWidth = 1920
const canvasHeight = 1440
const margin = {
  'top': 240,
  'bottom': 140,
  'side': 100,
}
const noteAreaWidth = canvasWidth - 2 * margin.side
const noteAreaHeight = canvasHeight - margin.top - margin.bottom
const noteRatio = 1
const scale = .5

const xPos = (note: RuntimeNote) => margin.side + noteAreaWidth * note.x
const yPos = (note: RuntimeNote) => {
  const r = Math.max(0, Math.min(1, note.y))
  const verDist = noteAreaHeight * r
  return (note.real_page.direction === 1) ? (margin.top + noteAreaHeight - verDist) : (margin.top + verDist)
}
const yPos2 = (dir: number, ratio: number) => {
  const r = Math.max(0, Math.min(1, ratio))
  const verDist = noteAreaHeight * r
  return (dir === 1) ? (margin.top + noteAreaHeight - verDist) : (margin.top + verDist)
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fonts = [{
  src: 'Rajdhani-SemiBold.ttf',
  family: 'Rajdhani',
}, {
  src: 'Electrolize-Regular.ttf',
  family: 'Electrolize',
}]

const noteTypes: {
  name: string
  up: { src: string, image?: unknown }
  down: { src: string, image?: unknown }
  tail?: { src: string, image?: unknown }
}[] = [{
  name: 'regular',
  up:   { src: 'note_up.png' },
  down: { src: 'note_down.png' },
}, {
  name: 'hold',
  up:   { src: 'hold_up.png' },
  down: { src: 'hold_down.png' },
  tail: { src: 'hold_tail.png' },
}, {
  name: 'long hold',
  up:   { src: 'long_hold.png' },
  down: { src: 'long_hold.png' },
  tail: { src: 'long_hold_tail.png' },
}, {
  name: 'chain head',
  up:   { src: 'chain_head_up.png' },
  down: { src: 'chain_head_down.png' },
}, {
  name: 'chain',
  up:   { src: 'chain_up.png' },
  down: { src: 'chain_down.png' },
}, {
  name: 'flick',
  up:   { src: 'flick_up.png' },
  down: { src: 'flick_down.png' },
}, {
  name: 'drag head',
  up:   { src: 'note_up.png' },
  down: { src: 'note_down.png' },
}, {
  name: 'drag',
  up:   { src: 'drag_up.png' },
  down: { src: 'drag_down.png' },
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
  { num: 7, div: 8, color: '#424242', lineWidth: 1, global: false },
]

function loadImage(src: string) {
  const img = new Image()
  return new Promise(resolve => {
    img.onload = function() {
      resolve(img)
    }
    img.src = src
  })
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('width', width.toString())
  canvas.setAttribute('height', height.toString())
  return canvas
}

export function loadAssets() {
  const promises = [] as Promise<void>[]

  fonts.forEach(async font => {
    const f = new FontFace(font.family, `url(/fonts/${font.src})`)
    promises.push(f.load().then(() => {
      // https://stackoverflow.com/questions/2756575/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).fonts.add(f)
    }))
  })

  noteTypes.forEach(async noteType => {
    promises.push(loadImage('/components/' + noteType.up  .src).then(image => { noteType.up  .image = image }))
    promises.push(loadImage('/components/' + noteType.down.src).then(image => { noteType.down.image = image }))
    if (noteType.tail) {
      const tail = noteType.tail
      promises.push(loadImage('/components/' + tail.src).then(image => { tail.image = image }))
    }
  })

  return Promise.all(promises)
}

function writeText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  align: 'right' | 'left',
  fontSize: number,
) {
  let arr = str.split('')
  if (align === 'right') arr = arr.reverse()
  let xi = x + fontSize * .3 * ((align === 'right') ? -1 : 1)
  arr.forEach((ch, i) => {
    xi = x + (fontSize * .3 + fontSize * .6 * i) * ((align === 'right') ? -1 : 1)
    ctx.fillText(ch, xi, y)
  })
  return xi + fontSize * .3 * ((align === 'right') ? -1 : 1)
}

function writeBpm(
  ctx: CanvasRenderingContext2D,
  bpm: number,
  x: number,
  y: number,
  fontSize: number,
  align: 'right' | 'left',
) {
  const [int, dec] = bpm.toFixed(2).split('.')
  ctx.textAlign = 'center'
  let xn
  if (align === 'right') {
    xn = writeText(ctx, dec, x, y, align, fontSize)
    xn = writeText(ctx, '.', xn + fontSize * 0.2, y, align, fontSize)
    xn = writeText(ctx, int, xn + fontSize * 0.2, y, align, fontSize)
  } else {
    xn = writeText(ctx, int, x, y, align, fontSize)
    xn = writeText(ctx, '.', xn - fontSize * 0.2, y, align, fontSize)
    xn = writeText(ctx, dec, xn - fontSize * 0.2, y, align, fontSize)
  }
  return xn
}

function initCanvas(ctx: CanvasRenderingContext2D, page: RuntimePage) {
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
  ctx.fillText('BPM', canvasWidth - fontSize * .2, fontSize)

  // SCANLINE
  fontSize = 80
  ctx.font = `${fontSize}px "Rajdhani"`
  ctx.textAlign = 'left'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('SCANLINE', fontSize * .2, fontSize)
}

function getBpmChange(a: number, b: number) {
  return Math.log2(a) - Math.log2(b)
}

function drawTempoChange(ctx: CanvasRenderingContext2D, page: RuntimePage, initBpmChange: number, lineSpeedChange: number) {
  const tempos = page.tempos
  const initBpm = tempos[0].bpm
  tempos.forEach((tempo, tempoIndex, tempos) => {
    const bpmChange = getBpmChange(tempo.bpm, initBpm)
    const hex = Math.min(168, Math.round(Math.abs(255 * bpmChange))).toString(16).padStart(2, '0')
    let color
        if (bpmChange > 0) color = `#FF0000${hex}`
    else if (bpmChange < 0) color = `#00FF66${hex}`
    else return
    ctx.fillStyle = color
    let start = yPos2(page.direction, (tempo.tick - page.start_tick) / page.delta_tick)
    let end = yPos2(page.direction, tempos[tempoIndex + 1] ? ((tempos[tempoIndex + 1].tick - page.start_tick) / page.delta_tick) : 1)
    if (start > end) [start, end] = [end, start]
    ctx.fillRect(0, start, canvasWidth, end - start)
  })
  let y = (page.direction > 0) ? canvasHeight : 0
  tempos.forEach((tempo, tempoIndex, tempos) => {
    const bpmChange = tempoIndex ? getBpmChange(tempo.bpm, initBpm) : initBpmChange
    const lineChange = tempoIndex ? bpmChange : lineSpeedChange
    const fontSize = 60
    ctx.font = `${fontSize}px "Rajdhani"`
    let start = yPos2(page.direction, (tempo.tick - page.start_tick) / page.delta_tick)
    let end = yPos2(page.direction, tempos[tempoIndex + 1] ? ((tempos[tempoIndex + 1].tick - page.start_tick) / page.delta_tick) : 1)
    if (start > end) [start, end] = [end, start]
    y = (page.direction > 0) ? Math.min(y, end - fontSize * .2) : Math.max(y, start + fontSize)
    let color = '#FFFFFF'
    if (bpmChange > 0) color = '#FF8888'
    if (bpmChange < 0) color = '#88FFBB'
    ctx.fillStyle = color
    writeBpm(ctx, tempo.bpm, canvasWidth - fontSize * .2, y, fontSize, 'right')
    color = '#FFFFFF'
    if (lineChange > 0) color = '#FF8888'
    if (lineChange < 0) color = '#88FFBB'
    ctx.fillStyle = color
    writeBpm(ctx, tempo.bpm / page.beats, fontSize * .2, y, fontSize, 'left')
    y -= fontSize * page.direction
  })
}

function drawDirection(ctx: CanvasRenderingContext2D, page: RuntimePage, lineSpeedChange: number) {
  const thickness = 80
  const grdStart = margin.top + ((page.direction > 0) ?  noteAreaHeight : 0)
  const grdEnd   = margin.top + ((page.direction > 0) ? (noteAreaHeight - thickness) : thickness)
  const grd = ctx.createLinearGradient(0, grdStart, 0, grdEnd)
  let color = '#FFFFFF'
  if (lineSpeedChange > 0) color = '#FF8888'
  if (lineSpeedChange < 0) color = '#88FFBB'
  ctx.fillStyle = color
  grd.addColorStop(0, `${color}90`)
  grd.addColorStop(1, `${color}00`)
  ctx.fillStyle = grd
  ctx.fillRect(0, (page.direction > 0) ? grdEnd : grdStart, canvasWidth, thickness)
}

function drawBeatLines(ctx: CanvasRenderingContext2D, page: RuntimePage) {
  beats.forEach(beat => {
    if (!beat.global) return
    for (let beatInt = 0; ; beatInt++) {
      const curBeat = beatInt + beat.num / beat.div + page.start_beat
      if (curBeat < 0) continue
      if (curBeat > page.beats) break
      drawBeatLine(ctx, yPos2(page.direction, curBeat / page.beats), beat.color, beat.lineWidth)
    }
  })
}

function drawBeatLine(ctx: CanvasRenderingContext2D, y: number, color: string, lineWidth: number) {
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(canvasWidth, y)
  ctx.stroke()
}

function approx(a: number, b: number, err: number) {
  return (Math.abs(a - b) < err)
}

function drawNoteLine(note: RuntimeNote, ctx: CanvasRenderingContext2D, base: number, startBeat: number) {
  let length = 300
  if (note.type === 5) length = 450
  if (note.type === 4) length = 200
  if (note.type === 7) length = 200
  let color
  beats.forEach(beat => {
    if (!beat.global && approx(note.beat * beat.div + startBeat, base * beat.num, 5 * beat.div))
      color = beat.color
  })
  if (!color) return
  ctx.beginPath()
  ctx.lineWidth = 4
  ctx.strokeStyle = color
  ctx.setLineDash([])
  ctx.moveTo(xPos(note) - length / 2, yPos(note))
  ctx.lineTo(xPos(note) + length / 2, yPos(note))
  ctx.stroke()
}

function drawTail(note: RuntimeNote, page: RuntimePage, ctx: CanvasRenderingContext2D) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tail: any = noteTypes[note.type].tail?.image
  const ratio = (note.type === 2) ? .8 : 1.4
  const width  = tail.width  * ratio * noteRatio
  const height = tail.height * ratio * noteRatio
  const top = margin.top
  const bottom = canvasHeight - margin.bottom

  let start = (page === note.real_page) ? yPos(note) : ((page.direction > 0) ? bottom : top)
  let end = (page === note.end_page) ? yPos2(note.real_page.direction, note.endY || 0) : ((page.direction > 0) ? top : bottom)
  if (page.direction > 0) [ start, end ] = [ end, start ]
  for (let point = start; point < end; point += height)
    ctx.drawImage(tail, xPos(note) - width / 2, point, width, Math.min(height, end - point))
}

function drawLink(note: RuntimeNote, ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.lineWidth = 23 * noteRatio
  ctx.setLineDash([9 * noteRatio, 9 * noteRatio])
  ctx.strokeStyle = '#FFFFFFBB'
  ctx.moveTo(xPos(note), yPos(note))
  if (note.next) ctx.lineTo(xPos(note.next), yPos(note.next))
  ctx.stroke()
}

function getRotate(note: RuntimeNote) {
  if (!note.next) return (note.real_page.direction > 0) ? Math.PI / 2 : -Math.PI / 2
  const dx = xPos(note.next) - xPos(note)
  const dy = yPos(note.next) - yPos(note)
  return Math.atan2(dx, -dy)
}

function drawNote(note: RuntimeNote, ctx: CanvasRenderingContext2D, dir: 'up' | 'down', shrink?: boolean) {
  if (!noteTypes[note.type]) return console.log('Unknown note type')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noteObj: any = noteTypes[note.type][dir].image
  let ratio = (note.type === 4 || note.type === 7) ? 0.6 : 1
  if (shrink) ratio *= 0.8
  const width  = noteObj.width  * ratio * noteRatio
  const height = noteObj.height * ratio * noteRatio
  const rotate = (note.type === 3) ? getRotate(note) - Math.PI / 4 : 0
  if (rotate) {
    ctx.save()
    ctx.translate(xPos(note), yPos(note))
    ctx.rotate(rotate)
    ctx.translate(-width / 2, -height / 2)
    ctx.drawImage(noteObj, 0, 0, width, height)
    ctx.restore()
  } else
    ctx.drawImage(noteObj, xPos(note) - width / 2, yPos(note) - height / 2, width, height)

}

function drawGroupLine(ctx: CanvasRenderingContext2D, group: {
  yPos: number;
  tick: number;
  arr: RuntimeNote[];
  minX: number;
  maxX: number;
  flag: boolean;
}, base: number) {
  if (group.arr.length < 2) return
  let color = '#545454'
  beats.forEach(beat => {
    if (approx(group.arr[0].beat * beat.div + group.arr[0].real_page.start_beat,
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

function drawPage(page: RuntimePage, isNext: boolean, base: number) {
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw 'ctx error!'
  const notes = page.notes.slice().reverse()
  let group = { yPos: 0, tick: -1, arr: [] as RuntimeNote[], minX: canvasWidth, maxX: 0, flag: false }
  notes.forEach(note => {
    if (note.type === 2) drawTail(note, page, ctx)
    if (note.type === 1) drawTail(note, page, ctx)
    if (note.next_id > 0) drawLink(note, ctx)
    if (!isNext && note.type !== 4 && note.type !== 7)
    // if (!isNext)
      drawNoteLine(note, ctx, base, page.start_beat)
    // draw siblings
    if (note.has_sibling) {
      if (note.tick !== group.tick && group.flag) { // handle existing group
        drawGroupLine(ctx, group, base)
        group = { yPos: 0, tick: -1, arr: [], minX: canvasWidth, maxX: 0, flag: false }
      }
      // same group
      if (note.type !== 4 && note.type !== 7) {
        group.yPos = yPos(note)
        group.tick = note.tick
        group.arr.push(note)
        group.minX = Math.min(group.minX, xPos(note))
        group.maxX = Math.max(group.maxX, xPos(note))
      }
      group.flag = true
    } else if (group.flag) { // handle existing group
      drawGroupLine(ctx, group, base)
      group = { yPos: 0, tick: -1, arr: [], minX: canvasWidth, maxX: 0, flag: false }
    }
  })
  if (group.flag) drawGroupLine(ctx, group, base)
  notes.forEach(note => { drawNote(note, ctx, (page.direction < 0) ? 'down' : 'up') })
  return canvas
}

export function processData(chart: Chart, pageNum: number, page_id: number) {
  const data: RuntimeChart = toRunTime(chart)

  const pages = data.pages as RuntimePage[]

  let longHolds = [] as RuntimeNote[]
  let targetBuffer = null
  let flag = false
  pages.forEach((page, page_i) => {
    if (pageNum && page.id >= pageNum || flag) return
    if (page_i !== page_id) {
      const newLongHolds = page.notes.filter(note => note.type === 2).reverse().concat(longHolds)
      longHolds = newLongHolds.filter(longHold => longHold.end_tick > page.end_tick)
      return
    }
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw 'ctx error!'

    // initial canvas
    const initBpm = page.tempos[0].bpm
    let prevBpm = page.prev ? page.prev.tempos[page.prev.tempos.length - 1].bpm : initBpm
    const lastBpm = page.tempos[page.tempos.length - 1].bpm
    const nextBpm = page.next ? page.next.tempos[0].bpm : lastBpm
    const bpmChange = getBpmChange(initBpm, prevBpm)
    const lineSpeedChange = page.prev ? getBpmChange(initBpm / page.beats, prevBpm / page.prev.beats) : 0
    const nextLineSpeedChange = page.next ? getBpmChange(nextBpm / page.next.beats, lastBpm / page.beats) : 0
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
    const newLongHolds = page.notes.filter(note => note.type === 2).reverse().concat(longHolds)
    newLongHolds.forEach(longHold => { drawTail(longHold, page, ctx) })
    longHolds.forEach(longHold => { drawNote(longHold, ctx, (longHold.real_page.direction < 0) ? 'down' : 'up', true) })
    longHolds = newLongHolds.filter(longHold => longHold.end_tick > page.end_tick)

    // draw this page
    ctx.drawImage(drawPage(page, false, data.time_base), 0, 0)

    prevBpm = page.tempos[page.tempos.length - 1].bpm

    // draw tempo changes
    drawTempoChange(ctx, page, bpmChange, lineSpeedChange)

    // write to file
    const finalCanvas = createCanvas(canvasWidth * scale, canvasHeight * scale)
    const finalCtx = finalCanvas.getContext('2d')
    if (!finalCtx) throw 'ctx error!'
    finalCtx.scale(scale, scale)
    finalCtx.drawImage(canvas, 0, 0)
    targetBuffer = finalCanvas.toDataURL('image/png')
    flag = true
    // fs.writeFileSync(`${path}/${`${page.id}`.padStart(3, '0')}.png`, finalCanvas.toBuffer())
  })
  return targetBuffer
}
