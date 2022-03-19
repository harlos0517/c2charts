import { Difficulty } from '@data/types/analyzed'

export const difficultyNames: Difficulty[] =
  ['Easy', 'Hard', 'Chaos', 'Glitch', 'Crash', 'Dream']

export const difficultyCodes = difficultyNames.map(d => d.toLowerCase())
