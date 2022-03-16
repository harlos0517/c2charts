interface RootObject {
  offline_song_pack_list: Offlinesongpacklist[];
  other_song_info_list: Othersonginfolist[];
}

interface Othersonginfolist {
  song_id: string;
  song_name?: any;
  artist?: any;
  charts?: any;
  is_hidden: boolean;
  IsDownloadOnly: boolean;
  Category?: any;
}

interface Offlinesongpacklist {
  song_pack_id: string;
  song_pack_name: string;
  theme_color: string;
  is_iap_pack: boolean;
  hasIM: boolean;
  price: string;
  Category: string;
  Descriptions: Descriptions;
  song_info_list: Songinfolist[];
}

interface Songinfolist {
  song_id: string;
  song_name: string;
  artist: string;
  charts: Charts;
  is_hidden: boolean;
  IsDownloadOnly: boolean;
  Category: string;
}

interface Charts {
  Easy: Easy;
  Hard: Easy;
  Chaos: Easy;
  Crash?: Easy;
  Glitch?: Easy;
  Dream?: Easy;
}

interface Easy {
  Level: string;
  MusicID: string;
  NeedUnlock: boolean;
}

interface Descriptions {
  'zh-TW'?: string;
  zh?: string;
  'zh-CN'?: string;
  en?: string;
  ja?: string;
  ko?: string;
}