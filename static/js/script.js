
let recognition;
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
    sendTranscriptToBackendGetAudio(finalTranscript);
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
  const backendUrl = 'http://127.0.0.1:5000/sendString';

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
    var msg = new SpeechSynthesisUtterance();
    msg.text = result.response; // Use the response from the backend
    window.speechSynthesis.speak(msg);
  })
  .catch(error => {
    console.error('Error sending data to backend:', error);
  });
}
function sendTranscriptToBackendGetAudio(transcript) {
    const backendUrl = 'https://duncan.pythonanywhere.com/sendStringForMp3';
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

function playback()
{
  const playSound = ctx.createBufferSource();
  playSound.buffer = audio;
  playSound.connect(ctx.destination);
  playSound.start(ctx.currentTime);
}