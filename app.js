const puppeteer = require('puppeteer');
require('dotenv').config();

var jitsiUrl = "https://meet.jit.si/jameswick"
var displayName = "JamesBot_" + getRandomUsernamePostfix();

var ttl = 60000 ; //How long (ms) before we kill off the video - otherwise it will loop
var videoFile = "bbb_480p.y4m" //See readme for details on Y4M conversions
var audioFile = "bbb_480p.wav" //Must be a .wav. Not sure of other constraints

function getRandomUsernamePostfix() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}

async function main(){
  if (process.argv.length > 2) {
    if (process.argv[2] == '-h' | process.argv[2] == '--help') {
      console.log('node app.js [FILENAME NO POSTFIX] [PLAYTIME (sec)] [JITSI URL+ROOM]');
      console.log('filename default bbb_480p; playtime default 60; url default https://meet.jit.si/jameswick');
      return;
    }
    videoFile = "media/" + process.argv[2] + ".y4m";
    audioFile = "media/" + process.argv[2] + ".wav";
  }
  if (process.argv.length > 3) {
    ttl = parseInt(process.argv[3]) * 1000;
  }
  if (process.argv.length > 4) {
    jitsiUrl = process.argv[4];
  }

  console.log(process.argv);
  console.log("using video: " + videoFile + ", audio: " + audioFile);
  console.log("using timeout: " + ttl/1000 + " seconds");
  console.log("using url: " + jitsiUrl);

  const meetArgs = [
      // Disable receiving of video
      //'config.channelLastN=0',
      //'config.constraints.video.height.min=120',
      // Turn off some bits of audio processing and unmute
      'config.disableAP=true', 'config.disableHPF=true&config.diableNS=true&config.disableAGC=true', 'config.startWithAudioMuted=false',
      // Don't use simulcast to save resources on the sender (our) side
      //'config.disableSimulcast=true',
      // No need to process audio levels
      'config.disableAudioLevels=true',
      // Disable P2P mode
      'config.p2p.enabled=false',
      //Skip prejoin page
      'config.prejoinPageEnabled=false',
      //Disable playing of other videos - Remember to turn this off if you use this to do screenshots!
      //'config.testing.noAutoPlayVideo',
      //Set local video resolution low to save cpu
      //'config.resolution=120',
      //only show filmstrip
      'interfaceConfig.filmStripOnly=true',

  ];

  const chromeArgs = [
      '--disable-dev-shm-usage',
      // Disable sandboxing, gives an error on Linux
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // Automatically give permission to use media devices
      '--use-fake-ui-for-media-stream',
      // Performance helping flags
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--window-size=400,300',
      '--disable-web-security',
      '--use-fake-device-for-media-stream',
      '--use-file-for-fake-video-capture=' + videoFile,
      // Use a file as the audio device
      '--use-file-for-fake-audio-capture=' + audioFile,
  ];

  //Init browser
  const browser = await puppeteer.launch({ args: chromeArgs, headless: true, ignoreHTTPSErrors: true });

  //Open new page
  const page = await browser.newPage();

  //Navigate to the conference
  console.log('Joining Conference...');
  const url = `${jitsiUrl}#${meetArgs.join('&')}&userInfo.displayName=%22${displayName}%22`;
  page.goto(url)


  //Abort any uneccessary requests to save resources
  page.setRequestInterception(true);
  page.on('request', request => {
      const resource = request.resourceType().toUpperCase();
      if (resource === 'IMAGE' || resource === 'MEDIA') {
          request.abort();
      } else {
          request.continue();
      }
  });

  //Set the bot to automatically kill itself after the TTL
  console.log("Connected, now waiting for ttl in ms: ", ttl)
  setTimeout(async () => {
      console.log('Hanging up...')
      await page.evaluate('APP.conference.hangup();')
      await page.close()
      await browser.close();
  }, ttl)

}

main();
