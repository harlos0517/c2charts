export interface ChartData {
  format_version: number
  time_base: number
  start_offset_time: number
  end_offset_time?: number
  is_start_without_ui?: boolean
	page_list: Page[]
	tempo_list: Tempo[]
	event_order_list: EventOrder[]
	note_list: Note[]
}

export interface Page {
  start_tick: number
  end_tick: number
  scan_line_direction: number
  PositionFunction?: PositionFunction
}

export interface PositionFunction {
  Type: number
  Arguments: number[]
}

export interface Tempo {
	tick: number
	value: number
}

export interface EventOrder {
  tick: number
  event_list: Event[]
}

export interface Event {
  type: number
  args: string
}

export interface Note {
  page_index: number
  type: number
  id: number
  tick: number
  x: number
  has_sibling: boolean
  hold_tick: number
  next_id: number
  is_forward: boolean
  NoteDirection?: number
}
