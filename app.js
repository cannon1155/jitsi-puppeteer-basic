const puppeteer = require('puppeteer');
require('dotenv').config();
const { exec } = require("child_process");

var displayName = "JamesBot_" + getRandomUsernamePostfix();

var ttl ;      // How long (ms) before we kill off the video - otherwise it will loop
var videoFile; // See readme for details on Y4M conversions
var audioFile; // Must be a .wav. Not sure of other constraints
var jitsiUrl;  // Jitsi meet URL with room postfix
var completed_conversions = []

function getRandomUsernamePostfix() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
};

function convert_mp4(media_type) {
  console.log(media_type + " converting file " + process.env.FILE + ".mp4...");
  filename = process.env.FILE;
  if (media_type == 'VIDEO') {
    exec('ffmpeg -i \"media/' + filename + '.mp4\" -pix_fmt yuv420p -map \"0:v\" \"media/' + filename + '.y4m\"',
    function(err, stdout) {
               handle_conversion_result(err, media_type);
           });
  }
  else if (media_type == "AUDIO") {
    exec('ffmpeg -i \"media/' + filename + '.mp4\" -af asetrate=48000,aresample=48000 \"media/' + filename + '.wav\"',
    function(err, stdout) {
               handle_conversion_result(err, media_type);
           });
  }
};

async function handle_conversion_result(err, media_type) {
  if (err) console.log(`error: ${err.message}`);
  completed_conversions.push(media_type);
  if (completed_conversions.length >= 2) {
    console.log("Converting done.")
    connect_and_play();
  }
};

async function main(){
  if (process.env.HELP == 'true') {
    console.log('=== ENV vars ===');
    console.log('FILENAME : mp4 filname no file extension!\n  default= surfing');
    console.log('PLAYTIME : how long the client stays in the call, in seconds\n  default= 30');
    console.log('URL      : the jitsi meet url and room\n  default= https://meet.jit.si/jameswick');
    return;
  }

  if (process.env.CONVERT == 'true') {
    convert_mp4("VIDEO");
    convert_mp4("AUDIO");
  }
  else {
    console.log("Skipping conversion.");
    connect_and_play();
  }
}

async function connect_and_play() {

  videoFile = "media/" + process.env.FILE + ".y4m";
  audioFile = "media/" + process.env.FILE + ".wav";
  ttl = parseInt(process.env.TIMEOUT) * 1000;
  jitsiUrl = process.env.URL;

  console.log(process.argv);
  console.log("using video: " + videoFile + ", audio: " + audioFile);
  console.log("using timeout: " + ttl/1000 + " seconds");
  console.log("using url: " + jitsiUrl);

  const meetArgs = [
      // Disable receiving of video
      //'config.channelLastN=0',
      //'config.constraints.video.height.min=120',
      // Turn off some bits of audio processing and unmute
      'config.disableAP=true',
      'config.disableHPF=true&config.diableNS=true&config.disableAGC=true',
      'config.startWithAudioMuted=false',
      // Don't use simulcast to save resources on the sender (our) side
      //'config.disableSimulcast=true',
      // No need to process audio levels
      'config.disableAudioLevels=true',
      // Disable P2P mode
      //'config.p2p.enabled=false',
      //Skip prejoin page
      'config.prejoinPageEnabled=false',
      //Disable playing of other videos - Remember to turn this off if you use this to do screenshots!
      //'config.testing.noAutoPlayVideo',
      //Set local video resolution low to save cpu
      //'config.resolution=120',
      //only show filmstrip
      //'interfaceConfig.filmStripOnly=true'
  ];

  const chromeArgs = [
      '--start-maximized',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      // Disable sandboxing, gives an error on Linux
      '--no-sandbox',
      //'--disable-setuid-sandbox',
      // Automatically give permission to use media devices
      '--use-fake-ui-for-media-stream',
      // Performance helping flags
      //'--disable-dev-shm-usage',
      //'--disable-accelerated-2d-canvas',
      //'--no-first-run',
      '--no-zygote',
      //'--single-process',
      //'--disable-gpu',
      //'--window-size=400,300',
      '--disable-web-security',
      '--use-fake-device-for-media-stream',
      '--use-file-for-fake-video-capture=' + videoFile,
      // Use a file as the audio device
      '--use-file-for-fake-audio-capture=' + audioFile
  ];

  //Init browser
  const browser = await puppeteer.launch({
    args: chromeArgs,
    headless: false,
    ignoreHTTPSErrors: true,
    executablePath: 'google-chrome-stable',
    ignoreDefaultArgs: [
         "--mute-audio"
     ] });

  //Open new page
  const page = await browser.newPage();
  page.setViewport({ width: 1366, height: 768});

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
