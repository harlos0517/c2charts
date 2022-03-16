interface RootObject {
  format_version: number;
  time_base: number;
  start_offset_time: number;
  end_offset_time?: number;
  is_start_without_ui?: boolean;
  page_list: Pagelist[];
  tempo_list: Tempolist[];
  event_order_list: Eventorderlist[];
  note_list: Notelist[];
}

interface Notelist {
  page_index: number;
  type: number;
  id: number;
  tick: number;
  x: number;
  has_sibling: boolean;
  hold_tick: number;
  next_id: number;
  is_forward: boolean;
  NoteDirection?: number;
}

interface Eventorderlist {
  tick: number;
  event_list: Eventlist[];
}

interface Eventlist {
  type: number;
  args: string;
}

interface Tempolist {
  tick: number;
  value: number;
}

interface Pagelist {
  start_tick: number;
  end_tick: number;
  scan_line_direction: number;
  PositionFunction?: PositionFunction;
}

interface PositionFunction {
  Type: number;
  Arguments: number[];
}