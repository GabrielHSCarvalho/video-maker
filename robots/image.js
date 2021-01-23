const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentias = require('../credentials/google-search.json')

async function robot() {
	const content = state.load()
	
	await fetchImagesOfAllSenteces(content)
	await downloadAllImages(content)
	
	state.save(content)
	
	async function fetchImagesOfAllSenteces(content) {
		console.log('> [image-robot] fetchImagesOfAllSenteces')
		for (const sentence of content.sentences) {
			//const query = `${content.searchTerm} ${sentence.keywords[0]}`
			const query = `${content.searchTerm}`
			sentence.images = await fetchGoogleAndReturnImagesLinks(query)
			
			sentence.googleSearchQuery = query
		}
	}
	
	async function fetchGoogleAndReturnImagesLinks(query) {
		console.log('> [image-robot] fetchGoogleAndReturnImagesLinks')
		const response = await customSearch.cse.list({
			auth: googleSearchCredentias.apiKey,
			cx: googleSearchCredentias.searchEngineId,
			q: query,
			searchType: 'image',
			//imgSize: 'XLARGE',
			num: 5
		})
		
		const imageUrl = response.data.items.map((item) => {
			return item.link
		})
		return imageUrl
	}
	
	async function downloadAllImages(content) {
		console.log('> [image-robot] downloadAllImages')
		content.downloadedImages = []

		for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
			const images = content.sentences[sentenceIndex].images

			for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
				const imageUrl = images[imageIndex]

				try {
					if (content.downloadedImages.includes(imageUrl)) {
						throw new Error('Image already downloaded')
					}

					await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
					content.downloadedImages.push(imageUrl)
					console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Image successfully downloaded: ${imageUrl}`)
					break
				} catch(error) {
					console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Error (${imageUrl}): ${error}`)
				}
			}
		}
	}

	async function downloadAndSave(url, fileName) {
		console.log('> [image-robot] downloadAndSave')
		return imageDownloader.image({
			url: url,
			dest: `./content/${fileName}`
		})
	}
	
	
}

module.exports = robot