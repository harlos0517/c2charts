export type Difficulty = 'Easy' | 'Hard' | 'Chaos' | 'Glitch' | 'Crash' | 'Dream'

export const difficultyName: Difficulty[] = ['Easy', 'Hard', 'Chaos', 'Glitch', 'Crash', 'Dream']

export const difficultyCode = difficultyName.map(d => d.toLowerCase())


export type AnalyzedRhythm = {
  count: number
  type: string
  pattern: string
  beats?: number
}

export type AnalyzedChart = {
  diff: Difficulty
  level: string
  char: {
    name: string
    id: string
    color: string
  }
  song: {
    name: string
    id: string
    composer: string
  }
  numOf: {
    page: number
    tempo: number
    event: number
    note: number
  }
  noteTypes: number[]
  time: number
  tempo: {
    min: number
    max: number
  }
  realTempo: {
    min: number
    max: number
  }
  lineSpeed: {
    min: number
    max: number
  }
  beats: {
    min: number
    max: number
  }
  notePerPage: {
    max: number
    realMax: number
    maxDensity: number
    maxRealDensity: number
    avgDensity: number
    avgRealDensity: number
  }
  holdBeat: {
    min: number
    max: number
  }
  holdTime: {
    min: number
    max: number
  }
  maxSibling: number
  maxFinger: number
  rhythmTotal: number
  topRhythms: AnalyzedRhythm[]
  sortIndex: number
}
