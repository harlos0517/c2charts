import { copyChartSrc, copySongPackSrc } from './getSrc'
import { analyzeCharts, analyzeSongPacks } from './analyzeType'
import { combineSongPack } from './combineSongPack'
import { processChart } from './processChart'
import { analyze } from './analyzeChart'

copyChartSrc()
copySongPackSrc()

analyzeCharts()
analyzeSongPacks()

combineSongPack()

processChart()

analyze()
