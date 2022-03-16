import FS from 'fs'

import { generateAssetsDir } from './paths'

const difficulty = ['Easy', 'Hard', 'Chaos', 'Glitch', 'Crash', 'Dream']

const beatDivs = [
  _v => 0,
  v => v / 8,
  v => v / 6,
  v => v / 4,
  v => v / 3,
  v => v * 3 / 8,
  v => v / 2,
  v => v * 5 / 8,
  v => v * 2 / 3,
  v => v * 3 / 4,
  v => v * 5 / 6,
  v => v * 7 / 8,
]

function getTime(tick, tempos, base) {
  let us = 0
  for (let i = 0; tempos[i] && tempos[i].tick < tick; i++) {
    const nextTick = tempos[i + 1] ? Math.min(tempos[i + 1].tick, tick) : tick
    const deltaTick = nextTick - tempos[i].tick
    us += deltaTick / base * tempos[i].value
  }
  return us
}

function preprocess(data) {
  const pages  = data.page_list
  const tempos = data.tempo_list
  const notes  = data.note_list

  tempos.forEach(tempo => {
    tempo.bpm = 60000000 / tempo.value
  })

  let curTempoIndex = 0
  let tempo = tempos[curTempoIndex]
  let prevTempo = tempos[curTempoIndex]
  let startBeat = 0
  pages.forEach((page, page_index) => {
    page.dir = page.scan_line_direction
    page.id = page_index
    page.delta = page.end_tick - page.start_tick
    page.next = pages[page_index + 1]
    page.prev = pages[page_index - 1]
    page.beats = page.delta / data.time_base
    page.start_beat = (page.beats % 1) ? startBeat : 0
    startBeat = (page.start_beat + page.beats) % 1

    page.tempos = []
    if (!tempo || page.start_tick < tempo.tick) {
      const newTempo = Object.assign({}, prevTempo)
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

  notes.forEach(note => {
    note.end_tick = note.tick + note.hold_tick
    let page = pages.find(page => page.id === note.page_index)
    if (note.is_forward) page = page.prev
    note.page = page
    note.page.notes.push(note)
    note.this_tick = note.tick - note.page.start_tick
    note.beat = note.this_tick % data.time_base
  })

  // find end tick page and time
  notes.forEach(note => {
    if (!note.hold_tick) return
    let thisPage = note.page
    const thisTime = getTime(note.tick, thisPage.tempos, data.time_base)
    let time = thisPage.deltaTime - thisTime
    while (thisPage.next && thisPage.next.start_tick < note.end_tick) {
      if (thisPage !== note.page) time += thisPage.deltaTime
      thisPage = thisPage.next
    }
    note.end_page = thisPage
    note.hold_time = time + getTime(note.end_tick, thisPage.tempos, data.time_base)
  })
}

function getInfo(chart, data, absTempo) {
  const pages  = data.page_list
  const tempos = data.tempo_list
  const events = data.event_order_list
  const notes  = data.note_list
  // get lengths
  chart.numOf = {
    page: pages.length,
    tempo: tempos.length,
    event: events.length,
    note: notes.length,
  }
  // get note types number
  chart.notes = []
  for (let i = 0; i < 8; i++) chart.notes.push(notes.filter(x => x.type === i).length)
  // get total time
  const lastTick = Math.max(...data.note_list.map(note => note.tick + note.hold_tick))
  chart.time = getTime(lastTick, tempos, data.time_base)
  // get tempo min max
  chart.tempo = {
    min: Math.min(...tempos.map(x => x.bpm)),
    max: Math.max(...tempos.map(x => x.bpm)),
  }
  chart.absTempo = absTempo ? {
    min: absTempo.min,
    max: absTempo.max,
  } : {
    min: Math.min(...tempos.map(x => x.bpm).filter(x => (x >= 70 && x < 325))),
    max: Math.max(...tempos.map(x => x.bpm).filter(x => (x >= 70 && x < 325))),
  }
  const lineSpeeds = [].concat(...pages.map(page => (page.tempos.map(tempo => tempo.bpm / page.beats))))
  chart.lineSpeed = {
    min: Math.min(...lineSpeeds),
    max: Math.max(...lineSpeeds),
  }
  chart.beats = {
    min: Math.min(...pages.map(x => x.beats)),
    max: Math.max(...pages.map(x => x.beats)),
  }
  // get notes per page
  chart.notePerPage = {
    max: Math.max(...pages.map(x => x.notes.length)),
    rMax: Math.max(...pages.map(x => x.notes.filter(x => x.type !== 4 && x.type !== 7).length)),
    densityMax: Math.max(...pages.map(page => page.notes.length / page.deltaTime * 1000000)),
    rDensityMax: Math.max(...pages.map(page => page.notes.filter(x => x.type !== 4 && x.type !== 7).length / (page.deltaTime / 1000000))),
    density: notes.length / (chart.time / 1000000),
    rDensity: notes.filter(x => x.type !== 4 && x.type !== 7).length / (chart.time / 1000000),
  }
  // get hold
  chart.holdBeat = {
    min: Math.min(...notes.filter(x => x.hold_tick !== 0).map(x => x.hold_tick / data.time_base)) || 0,
    max: Math.max(...notes.filter(x => x.hold_tick !== 0).map(x => x.hold_tick / data.time_base)) || 0,
  }
  chart.holdTime = {
    min: Math.min(...notes.filter(x => x.hold_tick !== 0).map(x => x.hold_time)) || 0,
    max: Math.max(...notes.filter(x => x.hold_tick !== 0).map(x => x.hold_time)) || 0,
  }
  // siblings
  let group = { tick: -1, len: 0, len2: 0, flag: false }
  let max = 1
  notes.forEach(note => {
    if (note.has_sibling) {
      if (note.tick !== group.tick && group.flag) { // handle existing group
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
  const cur = []
  notes.forEach((note, i) => {
    cur.forEach((x, xi) => {
      if (note.tick > x) cur.splice(xi, 1)
    })
    if (note.hold_tick) cur.push(note.end_tick)
    else if (note.type !== 4 && note.type !== 7) finger ++
    if (finger + cur.length > fingerMax) fingerMax = finger + cur.length
    if (!notes[i + 1] || note.tick < notes[i + 1].tick) finger = 0
  })
  chart.maxFinger = fingerMax
  return chart.absTempo
}

function approx(a, b, err) {
  return (Math.abs(a - b) < err)
}

function toHex(pattern) {
  let digits = 0
  let code = 0
  let string = ''
  pattern.forEach((e, i) => {
    digits++
    code = code * 2 + (e ? 1 : 0)
    if (digits === 4 || i === pattern.length - 1) {
      string += code.toString(16).toUpperCase()
      digits = 0
      code = 0
    }
  })
  return string
}

function getPatternStr(pattern) {
  const p = (i, l, r) => {
    if (!pattern[i] && !pattern[l] && !pattern[r]) return '-'
    if (!pattern[i] &&  pattern[l] &&  pattern[r]) return '◇'
    if (!pattern[i] && !pattern[l] &&  pattern[r]) return '>'
    if (!pattern[i] &&  pattern[l] && !pattern[r]) return '<'
    if ( pattern[i] && !pattern[l] && !pattern[r]) return 'X'
    return '?'
  }
  let str = ''
  for (let i = 0; i < pattern.length; i++) {
    str += p(i, i % 6 === 5 ? (i - 1) : -1, i % 6 === 1 ? (i + 1) : -1)
    if (i % 6 === 1 || i % 6 === 3) i++
  }
  return str
}

function getNextTick(start, begin, end, next, curPage, base) {
  if (!next || end >= next) {
    start = next || curPage.start_tick
    if (next) curPage = curPage.next || curPage
    while (curPage.next && curPage.next.start_beat)
      curPage = curPage.next

    next = curPage.next ? curPage.next.start_tick : curPage.end_tick
    end = start
  }
  begin = end
  if ((next - start) / base % 3 === 3 && (next - start) / base <= 9)
    end = begin + base * 3
  else if ((next - start) / base % 2 === 0)
    end = begin + base * 2
  else end = next
  return [start, begin, end, next, curPage]
}

function setRhythm(chart, data, global) {
  const sections = []
  const notes = data.note_list
  const pages = data.page_list
  const base = data.time_base
  let curPage = pages[0]

  let start, begin, end, next;
  [start, begin, end, next, curPage] = getNextTick(start, begin, end, next, curPage, base)
  let curSection = { start: begin, tick: end - begin, notes: [] }

  notes.filter(x => x.type !== 4 && x.type !== 7).forEach(note => {
    while (note.tick >= end - 5) {
      sections.push(curSection);
      [start, begin, end, next, curPage] = getNextTick(start, begin, end, next, curPage, base)
      curSection = { start: begin, tick: end - begin, notes: [] }
    }
    curSection.notes.push(note)
  })
  sections.push(curSection)
  const rhythms = []
  sections.forEach(section => {
    const pattern = []
    let otherFlag = false
    let curIndex = 0
    let curNote = section.notes[curIndex]
    const l = beatDivs.length
    for (let i = 0; Math.floor(i / l) * base + beatDivs[i % l](base) < section.tick - 5; i++) {
      pattern.push(0)
      if (!curNote) continue
      while (approx(curNote.tick - section.start, Math.floor(i / l) * base + beatDivs[i % l](base), 5)) {
        pattern[i]++
        curNote = section.notes[++curIndex]
        if (!curNote) break
      }
      if (!curNote) continue
      if (curNote.tick - section.start < Math.floor(i / l) * base + beatDivs[i % l](base) - 5)
        otherFlag = true
    }

    const rhythm = {}
    rhythm.type = 'r0'
    if (section.notes.length)
      if (getPatternStr(pattern).replace(/-+$/, '') === 'X') {
        rhythm.type = 'r8'
        rhythm.pattern = 'X'
      } else if (!otherFlag) {
        rhythm.type = 'r' + toHex(pattern)
        rhythm.pattern = getPatternStr(pattern)
        rhythm.beats = section.tick / base
      } else
        rhythm.type = 'rX'


    section.rhythm = rhythm

    if (rhythm.type !== 'r0' && rhythm.type !== 'rX') {
      const target = rhythms.find(x =>
        x.type === rhythm.type && (!x.beats || x.beats === rhythm.beats))
      if (!target) rhythms.push(Object.assign({ count: 1 }, rhythm))
      else target.count ++
    }

    const globalTarget = global.find(x =>
      x.type === rhythm.type && (!x.beats || x.beats === rhythm.beats))
    if (!globalTarget) global.push(Object.assign({ count: 1 }, rhythm))
    else globalTarget.count++
  })
  // chart.rhythms = rhythms
  chart.rhyTotal = rhythms.map(x => x.count).reduce((a, b) => a + b)
  chart.topRhythms = rhythms.sort((a, b) => {
    if (a.type === 'r8') return 1
    if (b.type === 'r8') return -1
    else return b.count - a.count
  }).slice(0, 3)
}

export function analyze() {
  const charactersData = FS.readFileSync(generateAssetsDir + 'songPacks.json', { encoding: 'utf-8' })
  const characters = JSON.parse(charactersData)
  
  const charts = []
  const rhythms = []
  let missingCharts = 0
  let allCharts = 0
  characters.forEach(character => {
    let thisCharts = 0
    character.song_info_list.forEach(song => {
      let absTempo
      for (let i = 0; i < 6; i++)
        if ((song.charts && song.charts[difficulty[i]]) || (!song.charts && !i)) {
          const chart = song.charts ? song.charts[difficulty[i]] : {
            Level: '?',
            MusicID: '',
            NeedUnlock: true,
          }
          chart.char = { name: character.song_pack_name, id: character.song_pack_id, color: character.theme_color }
          chart.song = { name: song.song_name, id: song.song_id, composer: song.artist }
          chart.diff = { name: difficulty[i], id: i, level: chart.level }
          allCharts++
          let chartData
          try {
            chartData = FS.readFileSync(
              '../assets/charts/' + `${song.song_id}_${i}.json`,
              { encoding: 'utf-8' },
            )
          } catch (err) {
            // console.error(`${song.song_id}_${i}.json NOT FOUND`)
            missingCharts++
            continue
          }
          thisCharts++
          const data = JSON.parse(chartData)
          preprocess(data)
          if (i) absTempo = getInfo(chart, data, absTempo)
          else absTempo = getInfo(chart, data)
          setRhythm(chart, data, rhythms)

          chart.sortIndex = charts.length
          charts.push(chart)
        }
    })
    console.log(character.song_pack_name, thisCharts)
  })
  rhythms.sort((a, b) => b.count - a.count)
  console.log(`${missingCharts} / ${allCharts} missing charts.`)
  FS.writeFileSync(generateAssetsDir + 'songsAnalyzed.json', JSON.stringify(charts, null, '\t'))
  FS.writeFileSync(generateAssetsDir + 'songsRhythm.json', JSON.stringify(rhythms, null, '\t'))
}
