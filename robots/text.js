const algorithmia = require('algorithmia')
const algorithmiaApikey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 
const nlu = new NaturalLanguageUnderstandingV1({
	iam_apikey: watsonApiKey,
	version: '2018-04-05',
	url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

const state = require('./state.js')

async function robot() {
	const content = state.load()
	
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)
	breakContentIntoSentences(content)	
	limitMaximumSentences(content)
	await fetchKeywordsOfAllSentence(content)
	
	state.save(content)
	
	async function fetchContentFromWikipedia(content) {
		console.log('text.fetchContentFromWikipedia')
		const algorithmiaAutenticated = algorithmia.client(algorithmiaApikey)
		const wikipediaAlgorithm = algorithmiaAutenticated.algo('web/WikipediaParser/0.1.2')
		const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
		const wikipediaContent = wikipediaResponse.get()
		
		content.sourceContentOriginal = wikipediaContent.content
	}
	
	function sanitizeContent(content) {
		console.log('text.sanitizeContent')
		const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
		const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

		content.sourceContentSanitized = withoutDatesInParentheses

		function removeBlankLinesAndMarkdown(text) {
		  const allLines = text.split('\n')

		  const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
			if (line.trim().length === 0 || line.trim().startsWith('=')) {
			  return false
			}

			return true
		  })

		  return withoutBlankLinesAndMarkdown.join(' ')
		}
	}

	function removeDatesInParentheses(text) {
		console.log('text.removeDatesInParentheses')
		return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
	}
	
	function breakContentIntoSentences(content) {
		console.log('text.breakContentIntoSentences')
		content.sentences = []
		
		const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
		sentences.forEach((sentence) => {
			content.sentences.push({
				text: sentence,
				keywords: [],
				images: []
			})
		})
		
	}
	
	function limitMaximumSentences(content) {
		console.log('text.limitMaximumSentences')
		content.sentences = content.sentences.slice(0, content.maximumSentences)		
	}

	async function fetchKeywordsOfAllSentence(content) {
		console.log('text.fetchKeywordsOfAllSentence')
		for (const sentence of content.sentences) {
			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
		}
		
	}
	async function fetchWatsonAndReturnKeywords(sentence) {
		console.log('text.fetchWatsonAndReturnKeywords')
		return new Promise((resolve, reject) => {
			nlu.analyze({
				text: sentence,
				features: {
					keywords: {}
				}
			}, (error, response) => {
				if (error) {
					//reject(error)
					//return
					throw error
				}

				const keywords = response.keywords.map((keyword) => {
					return keyword.text
				})

				resolve(keywords)
			})
		})
	}	
	
}

module.exports = robot