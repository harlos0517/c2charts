const fs = require('fs')

const chart2images = require('./chart2images.js')

const characters = require('./songs.json')

chart2images.loadAssets(()=>{
	let data = require(`./data/sample_V.json`)
	let path = `output/sample_V`
	console.time(`Written to ${path}`)
	chart2images.processData(data, path)
	console.timeEnd(`Written to ${path}`)
})