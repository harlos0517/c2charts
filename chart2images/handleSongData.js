const fs = require('fs')

const characters = require('./songs.json')

const difficulty = ['easy', 'hard', 'chaos', 'glitch']

function handleSongData() {
	characters.forEach(character=>{
		character.songs.forEach(song=>{
			for (let i = 0; i < 4; i++) {
				if (song.charts[difficulty[i]]) {
					let data = require(`./data/${character.id}_${song.id}_${i}_decrypted.json`)
					let lastNote  = data.note_list       [data. note_list      .length-1]
					let lastTempo = data.tempo_list      [data.tempo_list      .length-1]
					let lastEvent = data.event_order_list[data.event_order_list.length-1]
					let lastTick = Math.max(
						lastNote.tick + lastNote.holdTick,
						lastTempo.tick,
						lastEvent ? lastEvent.tick : 0
					)
					let j 
					for (j = 0; j < data.page_list.length; j++) {
						if (data.page_list[j].start_tick > lastTick) break
					}
					song.charts[difficulty[i]].pageNum = Math.min(j + 2, data.page_list.length)
				}
			}
		})
	})
	fs.writeFileSync(`./songs_processed.json`, JSON.stringify(characters, null, '\t'))
	fs.writeFileSync(`../web/songs.json`     , JSON.stringify(characters, null, '\t'))
	return characters
}

module.exports = handleSongData