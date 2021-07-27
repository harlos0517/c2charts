const fs = require('fs')
const express = require('express')
const app = express()
const argv = require('minimist')(process.argv.slice(2))
const chart2images = require('./chart2images.js')
const port = argv.p || 80

console.log('Starting server ...')

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.enable('trust proxy')

function diffId(difficulty) {
	if (difficulty==='easy'  ) return '0'  
	if (difficulty==='hard'  ) return '1'  
	if (difficulty==='chaos' ) return '2' 
	if (difficulty==='glitch') return '3'
	if (difficulty==='crash' ) return '4' 
}

app.get('/chart', (req, res) => {
  try {
    const { song_id, diff, page_id, other } = req.query
    const path = `assets/charts/${song_id}_${diffId(diff)}.txt.json`
		const chart_data_string = fs.readFileSync(path, { encoding: 'ascii' })
		const chart_data = JSON.parse(chart_data_string)
    const buf = chart2images.processData(chart_data, path, null, page_id)
    if (!buf) throw 'buffer is undefined'
    res.contentType('image/png')
    // res.contentLength(buf.length)
    res.send(buf).end()
  } catch (err) {
    res.status(500).send(err.message)
  }
})

chart2images.loadAssets().then(() => {
  app.listen(port, ()=>{
    console.log('Listening on port ' + port)
  })
})
