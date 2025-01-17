//const gm = require('gm').subClass({ imageMagick: true });
//const state = require('./state');
//const videoshow = require('videoshow');
//const path = require('path');
//const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
//const ffprobePath = require('@ffprobe-installer/ffprobe').path;
//
//const audio = path.join(__dirname, '../templates/1/newsroom.mp3');
//const video = path.join(__dirname, '../content/video-maker.mp4');
//
//let ffmpeg = require('fluent-ffmpeg');
//ffmpeg.setFfmpegPath(ffmpegPath);
//ffmpeg.setFfprobePath(ffprobePath);

const gm = require('gm').subClass({imageMagick: true})
const state = require('./state.js')
const spawn = require('child_process').spawn
const path = require('path')
const os = require('os');
const rootPath = path.resolve(__dirname, '..')
const fromRoot = relPath => path.resolve(rootPath, relPath)

const videoshow = require('videoshow')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
const audio = path.join(__dirname, '../templates/1/newsroom.mp3')
const video = path.join(__dirname, '../content/video-maker.mp4')

let ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

async function robot() {
  console.log('> [video-robot] Starting...')
  const content = state.load()

  await convertAllImages(content)
  await createAllSentenceImages(content)
  await createYouTubeThumbnail()
  //await createAfterEffectsScript(content)
  //await renderVideoWithAfterEffects()
  
  await createFFmpegScript(content)
  await renderVideoWithFFmpegAndNode(content)

  state.save(content)

  async function convertAllImages(content) {
	console.log('> [video-robot] convertAllImages...')    
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      await convertImage(sentenceIndex)
    }
  }

  async function convertImage(sentenceIndex) {
	console.log('> [video-robot] convertAllImages...')  
    return new Promise((resolve, reject) => {
      //const inputFile = fromRoot(`./content/${sentenceIndex}-original.png[0]`)
	  const inputFile = fromRoot(`.\\content\\${sentenceIndex}-original.png[0]`)
      //const outputFile = fromRoot(`.\\content\\${sentenceIndex}-converted.png`)
	  const outputFile = fromRoot(`.\\content\\${sentenceIndex}-converted.png`)
      const width = 1920
      const height = 1080

      gm()
        .in(inputFile)
        .out('(')
          .out('-clone')
          .out('0')
          .out('-background', 'white')
          .out('-blur', '0x9')
          .out('-resize', `${width}x${height}^`)
        .out(')')
        .out('(')
          .out('-clone')
          .out('0')
          .out('-background', 'white')
          .out('-resize', `${width}x${height}`)
        .out(')')
        .out('-delete', '0')
        .out('-gravity', 'center')
        .out('-compose', 'over')
        .out('-composite')
        .out('-extent', `${width}x${height}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error)
          }

          console.log(`> [video-robot] Image converted: ${outputFile}`)
          resolve()
        })

    })
  }

  async function createAllSentenceImages(content) {
	console.log('> [video-robot] createAllSentenceImages...')    
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
    }
  }

  async function createSentenceImage(sentenceIndex, sentenceText) {
	console.log('> [video-robot] createSentenceImage...')      
    return new Promise((resolve, reject) => {
      const outputFile = fromRoot(`./content/${sentenceIndex}-sentence.png`)

      const templateSettings = {
        0: {
          size: '1920x400',
          gravity: 'center'
        },
        1: {
          size: '1920x1080',
          gravity: 'center'
        },
        2: {
          size: '800x1080',
          gravity: 'west'
        },
        3: {
          size: '1920x400',
          gravity: 'center'
        },
        4: {
          size: '1920x1080',
          gravity: 'center'
        },
        5: {
          size: '800x1080',
          gravity: 'west'
        },
        6: {
          size: '1920x400',
          gravity: 'center'
        }

      }

      gm()
        .out('-size', templateSettings[sentenceIndex].size)
        .out('-gravity', templateSettings[sentenceIndex].gravity)
        .out('-background', 'transparent')
        .out('-fill', 'white')
        .out('-kerning', '-1')
        .out(`caption:${sentenceText}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error)
          }

          console.log(`> [video-robot] Sentence created: ${outputFile}`)
          resolve()
        })
    })
  }

  async function createYouTubeThumbnail() {
	console.log('> [video-robot] createYouTubeThumbnail...')      
    return new Promise((resolve, reject) => {
      gm()
        .in(fromRoot('./content/0-converted.png'))
        .write(fromRoot('./content/youtube-thumbnail.jpg'), (error) => {
          if (error) {
            return reject(error)
          }

          console.log('> [video-robot] YouTube thumbnail created')
          resolve()
        })
    })
  }

  async function createAfterEffectsScript(content) {
	console.log('> [video-robot] createYouTubeThumbnail...')      
    await state.saveScript(content)
  }

  async function renderVideoWithAfterEffects() {
	console.log('> [video-robot] renderVideoWithAfterEffects...')     
    return new Promise((resolve, reject) => {
      const systemPlatform=os.platform
      
      if (systemPlatform== 'darwin'){
        const aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender'
      }else if (systemPlatform=='win32'){
        const aerenderFilePath = '%programfiles%\Adobe\Adobe After Effects CC\Arquivos de suporte\aerender.exe'
      }else{
        return reject(new Error('System not Supported'))
      }
      
      const templateFilePath = fromRoot('./templates/1/template.aep')
      const destinationFilePath = fromRoot('./content/output.mov')

      console.log('> [video-robot] Starting After Effects')

      const aerender = spawn(aerenderFilePath, [
        '-comp', 'main',
        '-project', templateFilePath,
        '-output', destinationFilePath
      ])

      aerender.stdout.on('data', (data) => {
        process.stdout.write(data)
      })

      aerender.on('close', () => {
        console.log('> [video-robot] After Effects closed')
        resolve()
      })
    })
  }
  

  async function createFFmpegScript(content) {
    await state.saveScript(content);
  }

  async function renderVideoWithFFmpegAndNode(content) {
    console.log('> [video-robot] Rendering video with FFmpeg...');

    return new Promise((resolve, reject) => {
      let images = [];

      for (
        let sentenceIndex = 0;
        sentenceIndex < content.sentences.length;
        sentenceIndex++
      ) {
        images.push({
          path: `./content/${sentenceIndex}-converted.png`,
          caption: content.sentences[sentenceIndex].text,
        });
      }

      const audioParams = {
        fade: true,
        delay: 1, // seconds
      };

      const videoOptions = {
        fps: 30,
        loop: 10, // seconds
        transition: true,
        transitionDuration: 1, // seconds
        videoBitrate: 1024,
        videoCodec: 'libx264',
        size: '1280x?',
        audioBitrate: '128k',
        audioChannels: 2,
        format: 'mp4',
        pixelFormat: 'yuv420p',
        useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
        subtitleStyle: {
          Fontname: 'Verdana',
          Fontsize: '30',
          PrimaryColour: '11861244',
          SecondaryColour: '11861244',
          TertiaryColour: '11861244',
          BackColour: '-2147483640',
          Bold: '2',
          Italic: '0',
          BorderStyle: '2',
          Outline: '2',
          Shadow: '3',
          Alignment: '1', // left, middle, right
          MarginL: '40',
          MarginR: '60',
          MarginV: '40',
        },
      };

      videoshow(images, videoOptions)
        .audio(audio, audioParams) // adding audio
        .save(video)
        .on('start', function (command) {
          console.log(
            '\n\n [ FFmpeg still working in ]:\n\n',
            command,
            '\n\n[ Please wait... ]',
          );
        })
        .on('error', function (err, stdout, stderr) {
          console.error('Error:', err);
          console.error('ffmpeg stderr: ', stderr);
        })
        .on('end', function (output) {
          resolve();
          console.error(
            '\n\n[video-robot] Finished processing. Video created:\n\n',
            output,
            '\n\n',
          );
        });
    });
  }  

}

module.exports = robot