import { Chart } from './types/chart'
import {
  RuntimePage,
  RuntimeNote,
  RuntimeTempo,
  RuntimeEvent,
  RuntimeChart,
} from './types/runtimeChart'

export const toRunTime = (data: Chart) => {
  const pages = data.pages as unknown as RuntimePage[]
  const tempos = data.tempos as unknown as RuntimeTempo[]
  const events = data.events as unknown as RuntimeEvent[]
  const notes = data.notes as unknown as RuntimeNote[]

  pages.map((page, page_id) => {
    page.next = pages[page_id + 1]
    page.prev = pages[page_id - 1]
    page.tempos = page.tempo_ids.map(id => tempos[id])
    page.events = page.event_ids.map(id => events[id])
    page.notes = page.note_ids.map(id => {
      const note = notes.find(x => x.id === id)
      if (!note) throw 'Note not found!'
      return note
    })
  })

  notes.map(note => {
    const page = pages.find(p => p.id === note.page_id)
    if (!page) throw `[note] Page not found! Finding ${note.page_id} in length ${pages.length}`
    note.page = page
    const real_page = pages.find(p => p.id === note.real_page_id)
    if (!real_page) throw `[note] Page not found! Finding ${note.real_page_id} in length ${pages.length}`
    note.real_page = real_page
    note.next = notes[note.next_id]
    note.y = (note.tick - note.real_page.start_tick) / note.real_page.delta_tick
    if (!note.hold_tick) return
    note.end_page = pages.find(p => p.id === note.end_page_id)
    note.endY = note.end_page
      ? (note.end_tick - note.end_page.start_tick) / note.end_page.delta_tick
      : undefined
  })

  tempos.map(tempo => {
    const page = pages.find(p => p.id === tempo.page_id)
    if (!page)
      console.error(`[tempo] Page not found! Finding ${tempo.page_id} in length ${pages.length}`)
    else tempo.page = page
  })

  events.map(event => {
    const page = pages.find(p => p.id === event.page_id)
    if (!page) throw `[event] Page not found! Finding ${event.page_id} in length ${pages.length}`
    event.page = page
  })

  return { ...data, pages, tempos, events, notes } as RuntimeChart
}
