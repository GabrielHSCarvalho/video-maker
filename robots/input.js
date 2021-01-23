const readline = require('readline-sync')
const state = require('./state.js')

function robot() {
	const content = {
		maximumSentences: 7
	}

	content.searchTerm = askAndReturnSearchTerm()
	content.prefix = askAndReturnPrefix()
	state.save(content)

	//await robots.text(content)

	function askAndReturnSearchTerm() {
		console.log('> [input-robot] askAndReturnSearchTerm')
		return readline.question('Type a Wikipedia search term: ')
	}

	function askAndReturnPrefix() {
		console.log('> [input-robot] askAndReturnPrefix')		
		const prefixes = ['Who is', 'What is', 'The history of']
		const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
		const selectedPrefixText = prefixes[selectedPrefixIndex]
		
		return selectedPrefixText
	}
}

module.exports = robot