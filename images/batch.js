const fs = require('fs')

const chart2images = require('./chart2images.js')

const characters = require('./songs.json')

const rootPath = 'output'

function processChart(song, difficulty_id, character, path) {
	// Check directory existance
	if (!fs.existsSync(path))
		fs.mkdirSync(path)

	let data = require(`./data/${character.id}_${song.id}_${difficulty_id}_decrypted.json`)

	// check completeness
	let complete = true // set this to false and disable the following block to startover
	for (let page_index = 0; page_index < data.page_list.length; page_index++) {
		if (!fs.existsSync(`${path}/${`${page_index}`.padStart(3, '0')}.png`)) {
			complete = false
			break
		}
	}
	if (!complete) {
		console.time(`Written to ${path}`)
		chart2images.processData(data, path)
		console.timeEnd(`Written to ${path}`)
	}
}

function processSong(song, character, path) {
	if(song.level.easy  ) processChart(song, 0, character, `${path}/easy`  )
	if(song.level.hard  ) processChart(song, 1, character, `${path}/hard`  )
	if(song.level.chaos ) processChart(song, 2, character, `${path}/chaos` )
	if(song.level.glitch) processChart(song, 3, character, `${path}/glitch`)
}

function process() {
	chart2images.loadAssets(()=>{
		// Check directory existance
		if (!fs.existsSync(rootPath))
			fs.mkdirSync(rootPath)
		characters.forEach(character=>{
			// Check directory existance
			if (!fs.existsSync(`${rootPath}/${character.id}`))
				fs.mkdirSync(`${rootPath}/${character.id}`)
			character.songs.forEach(song=>{
				// Check directory existance
				if (!fs.existsSync(`${rootPath}/${character.id}/${song.id}`))
					fs.mkdirSync(`${rootPath}/${character.id}/${song.id}`)

				console.log(`[ Process Song ] ${character.name} - ${song.name}`)
				processSong(song, character, `${rootPath}/${character.id}/${song.id}`)
			})
		})
	})
}

process()