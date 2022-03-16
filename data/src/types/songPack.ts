export interface SongPack {
  song_pack_id: string
  song_pack_name: string
  theme_color: string
  is_iap_pack: boolean
  hasIM: boolean
  price: string
  Category: string
  Descriptions: Descriptions
  song_info_list: SongInfo[]
}

export interface SongInfo {
  song_id: string
  song_name: string | null
  artist: string | null
  charts: Charts | null
  is_hidden: boolean
  IsDownloadOnly: boolean
  Category: string | null
}

export interface Charts {
  Easy: ChartInfo
  Hard: ChartInfo
  Chaos: ChartInfo
  Crash?: ChartInfo
  Glitch?: ChartInfo
  Dream?: ChartInfo
}

export interface ChartInfo {
  Level: string
  MusicID: string
  NeedUnlock: boolean
}

export interface Descriptions {
  'zh-TW'?: string
  zh?: string
  'zh-CN'?: string
  en?: string
  ja?: string
  ko?: string
}
