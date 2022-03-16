export interface SongPackData {
  offline_song_pack_list: OfflineSongPack[]
  other_song_info_list: OtherSongInfo[]
}

export interface OtherSongInfo {
  song_id: string
  song_name: null
  artist: null
  charts: null
  is_hidden: boolean
  IsDownloadOnly: boolean
  Category: null
}

export interface OfflineSongPack {
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
  song_name: string
  artist: string
  charts: Charts
  is_hidden: boolean
  IsDownloadOnly: boolean
  Category: string
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
