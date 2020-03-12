# Cytus II Charts

This project is composed of two parts:

1. `chart2images` : Converts the chart data into images. Uses `node.js` with `canvas` module.
2. `web` : Webpage that displays the song list and charts. Uses `vue.js` and `bootstrap`.

This webpage is currently been deployed [here](http://linux1.csie.ntu.edu.tw:2501/index.html).
If you want to test on your own, you can setup a static server serving at `web/`.

## project stucture

### `chart2images/`

* `data/sample_V.json` : sample chart data
* `sample.js` : Entry point for sample convert. Usage: `node sample.js`
* `batch.js` : Entry point for batch convert. You don't need this unless you have all charts data.
* `chart2images.js` : The converter core.
* `*.png` : the notes used for rendering chart images
* `Rajdhani-SemiBold.ttf` : the font used for rendering chart images
* `package-lock.json` : the annoying thing `node.js` creates

### `web/`

* `index.*` CYTUS II song list
* `chart.*` chart display
* `songs.json` : CYTUS II character and song data - different from the other one, generated with more chart details
* `Rajdhani-SemiBold.ttf` : the font used for webpage

### `.gitignore`

Every Git user knows this.

### `README.md`

You are reading this.
