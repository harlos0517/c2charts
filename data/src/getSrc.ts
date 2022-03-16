import FS from 'fs'

import { srcDir, assetsDir, chartsDir } from './paths'

const otherChartNames = []

const prettify = (inFilePath: string, outFilePath: string) => {
  const data = FS.readFileSync(inFilePath, { encoding: 'utf-8' })
  const json = JSON.parse(data)
  const prettify_data = JSON.stringify(json, null, '\t')
  FS.writeFileSync(outFilePath, prettify_data)
}

export const copyChartSrc = () => {
  const files = FS.readdirSync(srcDir + 'TextAsset/')
  files.forEach(fileName => {
    if (/.*_[0-9]\.txt/.test(fileName)) {
      if (!/.*_[0-9]{3}_[0-9]\.txt/.test(fileName)) {
        const otherName = fileName.match(/(.*)_[0-9]\.txt/)
        if (otherName) otherChartNames.push(otherName[1])
        else throw 'This should not happen'
      }
      const withoutExt = fileName.match(/(.*_[0-9])\.txt/)
      if (!withoutExt) throw 'This should not happen'
      prettify(
        srcDir + 'TextAsset/' + fileName,
        chartsDir + withoutExt[1] + '.json',
      )
    }
  })
}

export const copySongPackSrc = () => {
  prettify(
    srcDir + 'TextAsset/' + 'song_pack_data',
    assetsDir + 'song_pack_data.json',
  )
  prettify(
    srcDir + 'TextAsset/' + 'expansion_pack_data',
    assetsDir + 'expansion_pack_data.json',
  )
}
