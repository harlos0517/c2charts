interface RootObject {
  ExpansionPackList: ExpansionPackList[];
  ExpansionBox: ExpansionBox[];
}

interface ExpansionBox {
  CreateOrder: number;
  Id: string;
  Name: string;
  IconPath: string;
  DefaultPrice: string;
  PackIds: string[];
}

interface ExpansionPackList {
  ExpansionPackId: string;
  ExpansionPackName: string;
  CreateOrder: number;
  IconPath: string;
  DefaultPrice: string;
  BoxId: string;
  IsBoxOnly: boolean;
  IsPrePurchase: boolean;
  SongInfoList: SongInfoList[];
}

interface SongInfoList {
  SongId: string;
  SongName: string;
  Artist: string;
  Charts: Charts;
  IsHidden: boolean;
  IsDownloadOnly: boolean;
  SongPackId: string;
  Category: string;
}

interface Charts {
  Easy: Easy;
  Hard: Easy;
  Chaos: Easy;
  Glitch?: Easy;
}

interface Easy {
  Level: string;
  MusicID: string;
  NeedUnlock: boolean;
}