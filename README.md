# Cytus II Charts

This project is composed of two parts:

1. images
	Converts the chart data into images. Uses `node.js` with `canvas` module.
2. diaplay
	Webpage that displays the song list and charts. Uses `vue.js` and `bootstrap`.

## project stucture

### `images/`

* `data/sample_V.json` : original chart data
* `output/sample_V/*.png` : rendered chart images
* `sample.js` : Entry point for sample convert. Usage: `node sample.js`
* `batch.js` : Entry point for batch convert. You don't need this unless you have all charts data.
* `chart2images.js` : The converter core.
* `*.png` : the notes used for rendering chart images
* `Rajdhani-SemiBold.ttf` : the font used for rendering chart images
* `package-lock.json` : the annoying thing `node.js` creates

### `display/`

* `index.*` CYTUS II song list
* `chart.*` chart display
* `songs.json` : CYTUS II character and song data
* `Rajdhani-SemiBold.ttf` : the font used for webpage

### `.gitignore`

Every Git users know this.

### `README.md`

You are reading this.