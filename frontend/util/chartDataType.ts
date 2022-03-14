export type ChartData = {
	format_version: number
	time_base: number
	start_offset_time: number
	page_list: Array<PageData>
	tempo_list: Array<TempoData>
	event_order_list: Array<EventOrderData>
	note_list: Array<NoteData>
}

export type PageData = {
	start_tick: number
	end_tick: number
	scan_line_direction: number
}

export type TempoData = {
	tick: number
	value: number
}

export type EventOrderData = {
	tick: number
	event_list: Array<EventData>
}

export type EventData = {
	type: number
	args: string
}

export type NoteData = {
	page_index: number
	type: number
	id: number
	tick: number
	x: number
	has_sibling: boolean
	hold_tick: number
	next_id: number
	is_forward: boolean
}
