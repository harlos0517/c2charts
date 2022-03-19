import FS from 'fs'

import { SongPackData } from './types/songPackData'
import { ExpansionPackData } from './types/expansionPackData'
import { SongPack, SongInfo } from './types/songPack'

import { assetsDir, generateAssetsDir } from './paths'

export const combineSongPack = () => {
  const songPackData = FS.readFileSync(assetsDir + 'song_pack_data.json', { encoding: 'utf-8' })
  const song_data = JSON.parse(songPackData) as SongPackData
  const expansionPackData = FS.readFileSync(assetsDir + 'expansion_pack_data.json', { encoding: 'utf-8' })
  const expansion_data = JSON.parse(expansionPackData) as ExpansionPackData

  const songPacks: SongPack[] = song_data.offline_song_pack_list
  songPacks.push({
    song_pack_id: 'other',
    song_pack_name: 'Other',
    theme_color: '#878787',
    is_iap_pack: false,
    hasIM: false,
    price: '',
    Category: 'Other',
    Descriptions: {},
    song_info_list: song_data.other_song_info_list.map(song => ({
      ...song,
      charts: {
        Easy: {
          Level: '?',
          MusicID: '',
          NeedUnlock: true,
        },
      },
    })),
  })

  expansion_data.ExpansionPackList.forEach(ep => {
    ep.SongInfoList.forEach(s => {
      const {
        SongId,
        SongName,
        Artist,
        Charts,
        IsHidden,
        IsDownloadOnly,
        SongPackId,
        Category,
      } = s
      const songInfo: SongInfo = {
        song_id: SongId,
        song_name: SongName,
        artist: Artist,
        charts: Charts,
        is_hidden: IsHidden,
        IsDownloadOnly,
        Category,
      }
      songPacks.find(x => x.song_pack_id === SongPackId)
        ?.song_info_list.push(songInfo)
        || console.log(`Song Pack ID ${SongPackId} not found.`)
    })
  })

  songPacks.forEach(songPack => {
    songPack.song_info_list.sort((a, b) => a.song_id.localeCompare(b.song_id))
  })

  const song_data_string = JSON.stringify(songPacks, null, '  ')
  const path = generateAssetsDir + 'songPacks.json'
  FS.writeFileSync(path, song_data_string)
}

if (require.main === module)
  combineSongPack()

