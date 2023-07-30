Llet recognition;
let isRecording = false;
let recordedChunks = [];
let timer;
const recordBtn = document.getElementById('recordBtn');
const recordingState = document.getElementById('recordingState');
const responseText = document.getElementById('responseText')
const audioPlayer = document.getElementById('audioPlayer');
const ctx = new AudioContext();
let audio;
let audioSource;
var OPENAI_API_KEY = ${{ secrets.OPENAI_KEY }};
var ELEVEN_LABS_API_KEY = "ebc13dfa297853586372a1acf0b80c1b";
var sVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel
var bSpeechInProgress = false;
var oSpeechRecognizer = null;

document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('playBtn');

  recordBtn.addEventListener('click', toggleRecording);

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.onresult = handleRecognitionResult;
});

function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  if (!isRecording) {
    recordedChunks = [];
    recognition.start();
    isRecording = true;
    recordBtn.disabled = true; // Disable the record button during recording
    recordingState.innerText = 'Recording...'; // Show the recording state
  }
}

function stopRecording() {
  recognition.stop();
  isRecording = false;
  clearTimeout(timer); // Clear the timer when the recording is stopped
  recordBtn.disabled = false; // Enable the record button after recording stops
  recordingState.innerText = 'Recording Stopped'; // Show the recording state

  const finalTranscript = responseText.innerText.trim();
  // Send the final transcript to the backend
  if (finalTranscript !== '') {
    sendTranscriptToBackend(finalTranscript);
    console.log(finalTranscript)
  }
}

function playRecording() {
  if (recordedChunks.length === 0) return;

  const blob = new Blob(recordedChunks, { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.play();
}

function handleRecognitionResult(event) {
  const interimTranscript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('');

  responseText.innerText = interimTranscript; // Show interim transcription in the recording state

  if (event.results[0].isFinal) {
    // If the transcript is final, start the timer for 2 seconds before stopping the recording
    clearTimeout(timer); // Reset the timer if the final transcript is updated
    timer = setTimeout(() => stopRecording(), 100);
  }
}

let audioElement = new Audio();

function sendTranscriptToBackend(transcript) {
  const backendUrl = 'https://duncanvoiceai.onrender.com/sendString';

  const data = { message: transcript };

  fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(result => {
    console.log('Backend response:', result);
    var response = result.response;
    SayIt(response);
  })
  .catch(error => {
    console.error('Error sending data to backend:', error);
  });
}
function sendTranscriptToBackendGetAudio(transcript) {
    const backendUrl = 'https://duncanvoiceai.onrender.com/sendStringForMp3';
    const data = { message: transcript };

    fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
     })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            audioPlayer.load();
            audioPlayer.play();
        }
    })
    .catch(error => console.error('Error:', error));
}

function SayIt(s) {
    /*var s = "Hello, this is a sample text."; // Replace with the text you want to convert to speech.*/

    if (s == "") {
        txtMsg.focus();
        return;
    }

    TextToSpeech(s);
}

// The existing TextToSpeech function from the provided code
function TextToSpeech(s) {
    if (chkMute.checked) return;

    if (selVoices.length > 0 && selVoices.selectedIndex != -1) {
        sVoiceId = selVoices.value;
    }

    spMsg.innerHTML = "Eleven labs text-to-speech...";

    var oHttp = new XMLHttpRequest();
    oHttp.open("POST", "https://api.elevenlabs.io/v1/text-to-speech/" + sVoiceId);
    oHttp.setRequestHeader("Accept", "audio/mpeg");
    oHttp.setRequestHeader("Content-Type", "application/json");
    oHttp.setRequestHeader("xi-api-key", ELEVEN_LABS_API_KEY);

    oHttp.onload = function () {
        if (oHttp.readyState === 4) {
            spMsg.innerHTML = "";

            var oBlob = new Blob([this.response], { "type": "audio/mpeg" });
            var audioURL = window.URL.createObjectURL(oBlob);
            var audio = new Audio();
            audio.src = audioURL;
            audio.play();
        }
    };

    var data = {
        text: s,
        voice_settings: { stability: 0, similarity_boost: 0 }
    };

    oHttp.responseType = "arraybuffer";
    oHttp.send(JSON.stringify(data));
}

function playback()
{
  const playSound = ctx.createBufferSource();
  playSound.buffer = audio;
  playSound.connect(ctx.destination);
  playSound.start(ctx.currentTime);
}
