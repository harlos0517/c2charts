import { Chart, EventOrder, Note, Page, Tempo } from '@/types/chart'

export type RuntimeChart = Chart & {
  pages: RuntimePage[]
  tempos: RuntimeTempo[]
  events: RuntimeEvent[]
  notes: RuntimeNote[]
}

export type RuntimePage = Page & {
  next?: RuntimePage
  prev?: RuntimePage
  tempos: RuntimeTempo[]
  events: RuntimeEvent[]
  notes: RuntimeNote[]
}

export type RuntimeTempo = Tempo & {
  page?: RuntimePage
}

export type RuntimeEvent = EventOrder & {
  page: RuntimePage
}

export type RuntimeNote = Note & {
  page: RuntimePage
  next?: RuntimeNote
  y: number
  end_page?: RuntimePage
  endY?: number
}

