export type Chart = {
  format_version: number
  time_base: number
  start_offset_time: number
  pages: Array<Page>
  tempos: Array<Tempo>
  events: Array<EventOrder>
  notes: Array<Note>
}

export type Page = {
  start_tick: number
  end_tick: number
  direction: number
  // new
  id: number
  delta_tick: number
  delta_time: number
  beats: number
  start_beat: number
  tempo_ids: Array<number>
  event_ids: Array<number>
  note_ids: Array<number>
}

export type Tempo = {
  tick: number
  value: number
  // new
  bpm: number
  bpmChange: number
  page_id: number
}

export type EventOrder = {
  tick: number
  event_list: Array<ChartEvent>
  // new
  page_id: number
}

export type ChartEvent = {
  type: number
  args: string
}

export type Note = {
  page_id: number
  type: number
  id: number
  tick: number
  x: number
  has_sibling: boolean
  hold_tick: number
  next_id: number
  is_forward: boolean
  // new
  real_page_id: number
  this_tick: number
  end_tick: number
  hold_time: number
  end_page_id: number
  beat: number
}
