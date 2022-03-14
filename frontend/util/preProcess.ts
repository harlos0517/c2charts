import { ChartData } from '@/util/chartDataType'
import { Chart, EventOrder, Note, Page, Tempo } from '@/util/chartType'

function getBpmChange(a: number, b: number) {
	return Math.log2(a) - Math.log2(b)
}

export function preprocess(data: ChartData) {
	const {
		page_list: data_page_list,
		tempo_list: data_tempo_list,
		event_order_list: data_event_list,
		note_list: data_note_list,
		...rest
	} = data

	const tempos: Array<Tempo> = data_tempo_list.map((t, t_i, t_l) => {
		const bpm = 60000000 / t.value
		const bpm_prev = 60000000 / (t_l[t_i - 1] || t).value
		const bpmChange = getBpmChange(bpm, bpm_prev)
		return { ...t, bpm, bpmChange, page_id: -1 }
	})

	const events: Array<EventOrder> = data_event_list.map(
		e => ({ ...e, page_id: -1 }),
	)

	let tempoIndex_cur = 0
	let tempo_cur = tempos[tempoIndex_cur]
	if (!tempo_cur) throw 'No tempo found in this chart!'
	let eventIndex_cur = 0
	let event_cur = events[eventIndex_cur]
	let startBeat = 0
	const pages: Array<Page> = data_page_list.map((p, p_i) => {
		// if this page hasn't reach the next tempo,
		// copy the previous tempo to here
		const tempo_ids: Array<number> = []
		if (!tempo_cur || p.start_tick < tempo_cur.tick)
			tempo_ids.push(tempoIndex_cur - 1)

		// loop for tempos in this page
		while (tempo_cur && p.end_tick > tempo_cur.tick) {
			tempo_ids.push(tempoIndex_cur)
			tempo_cur.page_id = p_i
			tempo_cur = tempos[++tempoIndex_cur]
		}

		// loop for events in this page
		const event_ids: Array<number> = []
		while (event_cur && p.end_tick > event_cur.tick) {
			event_ids.push(eventIndex_cur)
			event_cur.page_id = p_i
			event_cur = events[++eventIndex_cur]
		}

		const { scan_line_direction: direction, ...p_rest } = p
		const beats = (p.end_tick - p.start_tick) / data.time_base
		const page: Page = {
			...p_rest,
			direction,
			id: p_i,
			delta: p.end_tick - p.start_tick,
			beats,
			start_beat: startBeat,
			tempo_ids,
			event_ids,
			note_ids: [],
		}

		// incomplete beat
		startBeat = (startBeat + beats) % 1

		return page
	})

	const notes: Array<Note> = data_note_list.map((n, n_i) => {
		const page = pages.find(page => page.id === n.page_index)
		if (!page) throw 'The page of this note is not found!'
		page.note_ids.push(n_i)

		const { page_index: page_id, ...n_rest } = n
		const this_tick = n.tick - page.start_tick
		return {
			...n_rest,
			page_id,
			next_id: (n.next_id > 0) ? n.next_id : -1,
			this_tick,
			end_tick: n.tick + n.hold_tick,
			end_page_id: -1,
			beat: this_tick % data.time_base,
		}
	})

	// find the ending page of hold notes
	notes.forEach(n => {
		if (!n.hold_tick) return
		let pageIndex_cur  = n.page_id
		let page_cur  = pages.find(p => p.id === pageIndex_cur)
		pageIndex_cur++
		let page_next = pages.find(p => p.id === pageIndex_cur)
		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (!page_cur) throw 'Cannot find end tick page!'
			if (page_next && page_next.start_tick < n.end_tick) {
				page_cur  = page_next
				pageIndex_cur++
				page_next = pages.find(p => p.id === pageIndex_cur)
				continue
			}
			break
		}
		n.end_page_id = pageIndex_cur - 1
	})

	return { ...rest, pages, tempos, events, notes } as Chart
}
