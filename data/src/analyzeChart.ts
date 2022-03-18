import FS from 'fs'

import { AnalyzedChart, AnalyzedRhythm, difficultyNames } from './types/analyzed'
import { SongPack } from './types/songPack'

import { generateAssetsDir, generateChartsDir } from './paths'
import { Chart, Note, Tempo } from './types/chart'
import { toRunTime } from './runTimeChart'
import { RuntimeChart, RuntimeNote, RuntimePage } from './types/runtimeChart'

const isRealNote = (note: Note) => ![4, 7].includes(note.type)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMinMax = (array: Array<any>, sel?: (x: any) => number) => (sel ? {
  min: Math.min(...array.map(sel)),
  max: Math.max(...array.map(sel)),
} : {
  min: Math.min(...array),
  max: Math.max(...array),
})

const analyzeChart = (chart: RuntimeChart) => {
  const { pages, tempos, events, notes } = chart

  // get lengths
  const numOf = {
    page: pages.length,
    tempo: tempos.length,
    event: events.length,
    note: notes.length,
  }

  // get note types number
  const noteTypes = []
  for (let i = 0; i < 8; i++) noteTypes.push(notes.filter(x => x.type === i).length)

  // get total time
  const time = getTime(pages[pages.length - 1].end_tick, tempos, chart.time_base)

  // get tempo min max
  const tempo = getMinMax(tempos, x => x.bpm)

  const isTempoInRange = (x: Tempo) => x.bpm >= 70 && x.bpm < 325
  const realTempo = getMinMax(tempos.filter(isTempoInRange), x => x.bpm)

  const lineSpeeds = pages.map(
    page => page.tempo_ids.map(id => tempos[id].bpm / page.beats),
  ).flat()
  const lineSpeed = getMinMax(lineSpeeds)

  const beats = getMinMax(pages, x => x.beats)

  // get notes per page
  const lastTick = Math.max(...notes.map(note => note.tick + note.hold_tick))
  const lastTickTime = getTime(lastTick, tempos, chart.time_base)
  const getNoteJumps = (noteNum: number) => Math.max(0, noteNum - 1)
  const notePerPage = {
    max: Math.max(...pages.map(x => x.note_ids.length)),
    realMax: Math.max(...pages.map(
      page => getNoteJumps(page.note_ids.filter(id => isRealNote(notes[id])).length)),
    ),
    maxDensity: Math.max(...pages.map(page => page.note_ids.length / page.delta_time)),
    maxRealDensity: Math.max(...pages.map(
      page => getNoteJumps(page.note_ids.filter(id => isRealNote(notes[id])).length) / page.delta_time,
    )),
    avgDensity: notes.length / lastTickTime,
    avgRealDensity: getNoteJumps(notes.filter(isRealNote).length) / lastTickTime,
  }

  // get hold
  const holdBeat = getMinMax(notes.filter(x => x.hold_tick), x => x.hold_tick / chart.time_base)

  const holdTime = getMinMax(notes.filter(x => x.hold_tick), x => x.hold_time)

  // siblings
  let group = { tick: -1, len: 0, len2: 0, flag: false }
  let max = 1
  notes.forEach(note => {
    if (note.has_sibling) {
      // handle existing group
      if (note.tick !== group.tick && group.flag) {
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
  const maxSibling = max

  // max fingers
  let finger = 0
  let fingerMax = 1
  const cur: number[] = []
  notes.forEach((note, i) => {
    cur.forEach((x, xi) => {
      if (note.tick > x) cur.splice(xi, 1)
    })
    if (note.hold_tick) cur.push(note.end_tick)
    else if (note.type !== 4 && note.type !== 7) finger ++
    if (finger + cur.length > fingerMax) fingerMax = finger + cur.length
    if (!notes[i + 1] || note.tick < notes[i + 1].tick) finger = 0
  })
  const maxFinger = fingerMax

  return {
    numOf,
    noteTypes,
    time,
    tempo,
    realTempo,
    lineSpeed,
    beats,
    notePerPage,
    holdBeat,
    holdTime,
    maxSibling,
    maxFinger,
  }
}


const beatDivs: ((v: number) => number)[] = [
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

const getTime = (tick: number, tempos: Tempo[], base: number) => {
  let us = 0
  for (let i = 0; tempos[i] && tempos[i].tick < tick; i++) {
    const nextTick = tempos[i + 1] ? Math.min(tempos[i + 1].tick, tick) : tick
    const deltaTick = nextTick - tempos[i].tick
    us += deltaTick / base * tempos[i].value
  }
  return us / 1000000
}

const approx = (a: number, b: number, err: number) => {
  return (Math.abs(a - b) < err)
}

const toHex = (pattern: number[]) => {
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

const getPatternStr = (pattern: number[]) => {
  const p = (i: number, l: number, r: number) => {
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

const setRhythm = (chart: RuntimeChart, rhythms: AnalyzedRhythm[]) => {
  const pages: RuntimePage[] = chart.pages
  const notes: RuntimeNote[] = chart.notes
  const base = chart.time_base

  // Each fragment has it's rhythm pattern
  // Each section must have integer beats and contains 1 or multiple pages
  const fragments: { start_tick: number, end_tick: number }[] = []
  let curPage = pages[0]
  let sectionStart
  let sectionEnd = pages[0].start_tick

  while (curPage.next) {
    // find next section
    sectionStart = sectionEnd
    curPage = curPage.next
    while (curPage.next && curPage.next.start_beat !== 0) curPage = curPage.next
    sectionEnd = curPage.next ? curPage.next.start_tick : curPage.end_tick

    const sectionTick = sectionEnd - sectionStart
    if (sectionTick % (base * 3) === 0) {
      const fragmentCount = sectionTick / (base * 3)
      const fragmentTick = base * 3
      for (let i = 0; i < fragmentCount; i++) {
        fragments.push({
          start_tick: sectionStart + i * fragmentTick,
          end_tick: sectionStart + (i + 1) * fragmentTick,
        })
      }
    } else if (sectionTick % (base * 2) === 0) {
      const fragmentCount = sectionTick / (base * 2)
      const fragmentTick = base * 2
      for (let i = 0; i < fragmentCount; i++) {
        fragments.push({
          start_tick: sectionStart + i * fragmentTick,
          end_tick: sectionStart + (i + 1) * fragmentTick,
        })
      }
    } else {
      fragments.push({
        start_tick: sectionStart,
        end_tick: sectionEnd,
      })
    }
  }

  const fragmentsWithNotes = fragments.map(f => ({
    ...f,
    notes: notes.filter(n => isRealNote(n) && n.tick >= f.start_tick && n.tick < f.end_tick),
  }))

  const thisRhythms: AnalyzedRhythm[] = []
  fragmentsWithNotes.forEach(fragment => {
    const pattern = []
    let otherFlag = false
    let curIndex = 0
    let curNote = fragment.notes[curIndex]
    const l = beatDivs.length
    for (let i = 0;; i++) {
      const beatPoint = fragment.start_tick + Math.floor(i / l) * base + beatDivs[i % l](base)
      if (beatPoint >= fragment.end_tick) break
      pattern.push(0)
      if (!curNote) continue
      while (approx(curNote.tick, beatPoint, 5)) {
        pattern[i]++
        curNote = fragment.notes[++curIndex]
        if (!curNote) break
      }
      if (!curNote) continue
      if (curNote.tick < beatPoint - 5)
        otherFlag = true
    }

    const beats = (fragment.end_tick - fragment.start_tick) / base
    const rhythm =
      !fragment.notes.length ?
        { type: 'r0', pattern: '-', beats: 0 } :
      getPatternStr(pattern).replace(/-+$/, '') === 'X' ?
        { type: 'r8', pattern: 'X', beats: 0 } :
      !otherFlag || (beats <= 16 && beats % 1 === 0) ?
        {
          type: 'r' + toHex(pattern),
          pattern: getPatternStr(pattern),
          beats,
        } :
      { type: 'rX', pattern: '', beats: 0 }

    // page.rhythm = rhythm

    if (rhythm.type !== 'r0' && rhythm.type !== 'rX') {
      const target = thisRhythms.find(x =>
        x.type === rhythm.type && (!x.beats || x.beats === rhythm.beats))
      if (!target) thisRhythms.push({ ...rhythm, count: 1 })
      else target.count ++
    }

    const globalTarget = rhythms.find(x =>
      x.type === rhythm.type && (!x.beats || x.beats === rhythm.beats))
    if (!globalTarget) rhythms.push({ ...rhythm, count: 1 })
    else globalTarget.count++
  })
  // chart.rhythms = thisRhythms
  return {
    rhythmTotal: thisRhythms.map(x => x.count).reduce((a, b) => a + b, 0),
    topRhythms: thisRhythms.sort((a, b) => {
      if (a.type === 'r8') return 1
      if (b.type === 'r8') return -1
      else return b.count - a.count
    }).slice(0, 3),
  }
}


// main function
export const analyze = () => {
  const songPacksData = FS.readFileSync(generateAssetsDir + 'songPacks.json', { encoding: 'utf-8' })
  const songPacks: SongPack[] = JSON.parse(songPacksData)

  const charts: AnalyzedChart[] = []
  const rhythms: AnalyzedRhythm[] = []

  songPacks.forEach(character => {
    character.song_info_list.forEach(song => {
      let realTempo: { min: number, max: number } | null = null

      for (let i = 0; i < difficultyNames.length; i++) {
        const diff = difficultyNames[i]

        const chartInfo = song.charts[diff]
        if (!chartInfo) continue

        let chartData: string
        try {
          chartData = FS.readFileSync(
            generateChartsDir + `${song.song_id}_${i}.json`,
            { encoding: 'utf-8' },
          )
        } catch (err) { return }
        console.log('Processing ' + `${song.song_id}_${i}.json` + ' ...')
        const data: Chart = JSON.parse(chartData)
        const chart = toRunTime(data)

        const analyzedChart: AnalyzedChart = {
          diff,
          level: chartInfo?.Level || '?',
          char: {
            name: character.song_pack_name,
            id: character.song_pack_id,
            color: character.theme_color,
          },
          song: {
            name: song.song_name || '',
            id: song.song_id,
            composer: song.artist || '',
          },
          sortIndex: charts.length,
          ...analyzeChart(chart),
          ...setRhythm(chart, rhythms),
        }

        // use the real tempo from easy chart
        if (i && realTempo) analyzedChart.realTempo = { ...realTempo }
        else realTempo = { ...analyzedChart.tempo }

        charts.push(analyzedChart)
      }
    })
  })

  rhythms.sort((a, b) => b.count - a.count)

  const allCharts = songPacks.reduce(
    (total, songPack) => total + songPack.song_info_list.reduce(
      (subtotal, songInfo) => subtotal += Object.keys(songInfo.charts).length,
      0,
    ),
    0,
  )
  const missingCharts = allCharts - charts.length
  console.log(`${missingCharts} / ${allCharts} missing charts.`)

  FS.writeFileSync(generateAssetsDir + 'songsAnalyzed.json', JSON.stringify(charts, null, '  '))
  FS.writeFileSync(generateAssetsDir + 'songsRhythm.json', JSON.stringify(rhythms, null, '  '))
}

if (require.main === module) analyze()
