const readline = require('readline-sync')
const robots = {
	state: require('./robots/state.js'),
	input: require('./robots/input.js'),
	text: require('./robots/text.js'),
	image: require('./robots/image.js'),
	video: require('./robots/video.js')
}

async function start() {
	//console.log('> [index] start')
	//robots.input()
	//await robots.text()
	//await robots.image()
	await robots.video()
	
	//const content = robots.state.load()
	console.dir(content, { depth: null })
}

start()


