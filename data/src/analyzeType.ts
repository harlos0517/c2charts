import FS from 'fs'

import JsonToTS  from 'json-to-ts'

import { assetsDir, chartsDir } from './paths'

export const analyzeCharts = () => {
  const fullData = [] as unknown[]

  const files = FS.readdirSync(chartsDir)
  files.forEach(fileName => {
    const data = FS.readFileSync(chartsDir + fileName, { encoding: 'utf-8' })
    const json = JSON.parse(data)
    fullData.push(json)
  })

  const typeData = JsonToTS(fullData).join('\n\n')
  FS.writeFileSync('types/chartDataRaw.ts', typeData)
}

export const analyzeSongPacks = () => {
  const data = FS.readFileSync(assetsDir + 'song_pack_data.json', { encoding: 'utf-8' })
  const json = JSON.parse(data)
  const typeData = JsonToTS(json).join('\n\n')
  FS.writeFileSync('types/songPackDataRaw.ts', typeData)

  const data2 = FS.readFileSync(assetsDir + 'expansion_pack_data.json', { encoding: 'utf-8' })
  const json2 = JSON.parse(data2)
  const typeData2 = JsonToTS(json2).join('\n\n')
  FS.writeFileSync('types/expansionPackDataRaw.ts', typeData2)
}

if (require.main === module) {
  analyzeCharts()
  analyzeSongPacks()
}
