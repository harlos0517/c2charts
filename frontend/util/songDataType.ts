export type SongData = {
	offline_song_pack_list: Array<SongPack>
	other_song_info_list: Array<SongInfo>
}

export type ExpansionData = {
	ExpansionPackList: Array<ExpansionPack>
	ExpansionBox: Array<ExpansionBox>
}

export type ExpansionBox = {
	CreateOrder: number
	Id: string
	Name: string
	IconPath: string
	DefaultPrice: string
	PackIds: Array<string>
}

export type ExpansionPack = {
	ExpansionPackId: string
	ExpansionPackName: string
	CreateOrder: number
	IconPath: string
	DefaultPrice: string
	BoxId: string
	IsBoxOnly: boolean
	IsPrePurchase: boolean
	SongInfoList: Array<ExpansionSongInfo>
}

export type SongPack = {
	song_pack_id: string
	song_pack_name: string
	theme_color: string
	is_iap_pack: boolean
	hasIM: boolean
	price: string
	Category: string
	// eslint-disable-next-line @typescript-eslint/ban-types
	Descriptions: {}
	song_info_list: Array<SongInfo>
}

export type SongInfo = {
	song_id: string
	song_name: string | null
	artist: string | null
	charts: ChartsInfo | null
	is_hidden: boolean
	IsDownloadOnly: boolean
	Category: string | null
  pageNum?: number
}

export type ExpansionSongInfo = {
	SongId: string
	SongName: string | null
	Artist: string | null
	Charts: ChartsInfo | null
	IsHidden: boolean
	IsDownloadOnly: boolean
	SongPackId: string
	Category: string | null
}

export type ChartsInfo = {
	Easy: ChartInfo
	Hard: ChartInfo
	Chaos: ChartInfo
	Glitch?: ChartInfo
	Crash?: ChartInfo
}

export type ChartInfo = {
	Level: string
	MusicID: string
	NeedUnlock: boolean
  pageNum: number
}
