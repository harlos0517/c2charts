import { Difficulty } from '@/types/analyzed'

export interface ExpansionPackData {
  ExpansionPackList: ExpansionPack[]
  ExpansionBox: ExpansionBox[]
}

export interface ExpansionBox {
  CreateOrder: number
  Id: string
  Name: string
  IconPath: string
  DefaultPrice: string
  PackIds: string[]
}

export interface ExpansionPack {
  ExpansionPackId: string
  ExpansionPackName: string
  CreateOrder: number
  IconPath: string
  DefaultPrice: string
  BoxId: string
  IsBoxOnly: boolean
  IsPrePurchase: boolean
  SongInfoList: SongInfoList[]
}

export interface SongInfoList {
  SongId: string
  SongName: string
  Artist: string
  Charts: Charts
  IsHidden: boolean
  IsDownloadOnly: boolean
  SongPackId: string
  Category: string
}

export type Charts = {
  [key in Difficulty]: ChartInfo
}

export interface ChartInfo {
  Level: string
  MusicID: string
  NeedUnlock: boolean
}
