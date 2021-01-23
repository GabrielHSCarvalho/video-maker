const scriptFilePath = './content/ffmpeg-script.js';

const fs = require('fs')
const contentFilePath= './content.json'

function save(content) {
	console.log('> [state-robot] save...')
	const contentString = JSON.stringify(content)
	return fs.writeFileSync(contentFilePath, contentString)	
}

function load() {
	console.log('> [state-robot] load...')
	const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
	const contentJson = JSON.parse(fileBuffer)
	return contentJson	
}

function saveScript(content) {
	console.log('> [state-robot] saveScript...')
	const contentString = JSON.stringify(content);
	const scriptString = `var content = ${contentString}`;
	return fs.writeFileSync(scriptFilePath, scriptString);
}

module.exports = {
	save,
	load,
	saveScript
}