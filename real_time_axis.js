const container = document.getElementById('spectrogram-container');
const startBtn = document.getElementById('startBtn');
const canvas = document.getElementById('spectrogramCanvas');
const stopButton=document.getElementById('stopButton');
const canvasCtx = canvas.getContext('2d');
const axisCanvas = document.getElementById('frequency-axis');
const axisCtx = axisCanvas.getContext('2d')
const Y_AXIS_WIDTH=50;

const containerHeight = container.clientHeight;
const containerWidth = container.clientWidth;
const dpr = window.devicePixelRatio || 1;

// Spectrogram canvas
canvas.width = containerWidth * dpr;
canvas.height = containerHeight * dpr;
canvas.style.width = containerWidth + 'px';
canvas.style.height = containerHeight + 'px';
canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

// Axis canvas
axisCanvas.width = Y_AXIS_WIDTH * dpr;
axisCanvas.height = containerHeight * dpr;
axisCanvas.style.width = Y_AXIS_WIDTH + 'px';
axisCanvas.style.height = containerHeight + 'px';
axisCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
const frequencyCutoff = 8000;


const HEIGHT=canvas.height;

// Variables for the audio processing
let audioContext;
let analyser;
let dataArray;
let bufferLength;
let animationFrameId;
let stream
let maxFrequency;
let cutoffIndex;
const MAGMA_STOPS = [
  {t: 0.0, r:0, g:0, b:4},
  {t: 0.25, r:60, g:13, b:91},
  {t:0.5, r:126, g:43, b:114},
  {t:0.75, r:211, g:109, b:95},
  {t:1.0, r:252, g:181, b:62}
];

const bandEdges = [0, 64, 128, 256, 512, 1024, 2048, 4096, 8000]; // 8 bands



// Color mapping for the spectrogram
const colorMap = (value) => {
  const {r, g, b} = grayToMagma(value);
  return `rgb(${r}, ${g}, ${b})`; // CSS-compatible string
};


//render a magma colormap
function grayToMagma(gray){
  let t = Math.max(0, Math.min(1,gray/255));//normalize
  //find stops
  let i=0;
  while(i<MAGMA_STOPS.length-1 && t>MAGMA_STOPS[i+1].t)
    i++;
  const a=MAGMA_STOPS[i];
  const b=MAGMA_STOPS[i+1];
  const u=(t-a.t)/(b.t-a.t);
  return{
    r: Math.round(lerp(a.r, b.r, u)),
    g: Math.round(lerp(a.g, b.g, u)),
    b: Math.round(lerp(a.b, b.b, u))
  };
  
};
function lerp(a, b, t) {return a+(b-a)*t;};

// Function to start audio processing
const startSpectrogram = async () => {
    
  if (audioContext) return; // Prevent multiple instances

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();

  // Set the FFT size for the analyser
  analyser.fftSize = 2048;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  const sampleRate = audioContext.sampleRate;
  maxFrequency = sampleRate / 2;
  cutoffIndex = Math.floor((frequencyCutoff / maxFrequency) * bufferLength);


  try {
    // Get microphone audio stream
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioSource = audioContext.createMediaStreamSource(stream);

    // Connect the audio graph: source -> analyser -> destination
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);

    // Begin the drawing loop
    drawSpectrogram();
    drawAxis();
    } catch (err) {
    console.error('Error accessing microphone:', err);
    alert('Could not access your microphone. Please check your browser permissions.');
  }
};

// Add event listener to the start button
startBtn.addEventListener('click', startSpectrogram);


// Function to draw the spectrogram
const drawSpectrogram = () => {
  
  // Request the next animation frame
  animationFrameId=requestAnimationFrame(drawSpectrogram);

  // Copy the frequency data into the dataArray
  analyser.getByteFrequencyData(dataArray);

  // Shift the existing canvas content to the left
  const imageData = canvasCtx.getImageData(1, 0, canvas.width - 1, canvas.height);
  canvasCtx.putImageData(imageData, 0, 0);

  const bandWidth = maxFrequency / bufferLength;

  // Draw the new frequency data as a single vertical line on the right edge
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i];
    const color = colorMap(value);
    const freq = (i / bufferLength) * maxFrequency;

    if (freq > frequencyCutoff) continue;

    const yTop = freqToY(freq, canvas.height);
    const yBottom = freqToY(freq + bandWidth, canvas.height);
    let yStart = Math.min(yTop, yBottom);
    let yEnd = Math.max(yTop, yBottom);

// Ensure minimum height of 1 pixel to avoid collapse
    if (yEnd - yStart < 1) yEnd = yStart + 1;
    canvasCtx.fillStyle = color;
    canvasCtx.fillRect(canvas.width - 1, yStart, 1, yEnd - yStart);
  }
  
};

function freqToY(freq, canvasHeight) {
  const bandCount = bandEdges.length - 1;
  const bandHeight = canvasHeight / bandCount;

  let bandIndex = bandEdges.findIndex((edge, i) => freq >= edge && freq < bandEdges[i + 1]);
  if (bandIndex === -1) bandIndex = bandCount - 1;

  const f0 = bandEdges[bandIndex];
  const f1 = bandEdges[bandIndex + 1];
  const frac = (freq - f0) / (f1 - f0);

  return canvasHeight - (bandIndex + frac) * bandHeight;
};

 // Draw frequency axis
function drawAxis() {
    axisCtx.clearRect(0, 0, Y_AXIS_WIDTH, axisCanvas.height);
    axisCtx.font = '10px sans-serif';
    axisCtx.fillStyle = 'black';
    axisCtx.textAlign = 'right';

    const labels = [0, 500, 1000, 2000, 4000, 8000]; // Target frequencies
    bandEdges.forEach(freq => {
      const y = freqToY(freq, axisCanvas.height);
      axisCtx.fillText(`${freq} Hz`, Y_AXIS_WIDTH - 5, y);

  });
  };

stopButton.addEventListener('click', () => {

  if (stream && audioSource && audioContext) {
    
    // 1. Disconnect the source node
    audioSource.disconnect();
    
    // 2. Stop all the tracks on the stream
    stream.getTracks().forEach(track => track.stop());
    
    // 3. Close the AudioContext to release hardware resources
    audioContext.close();

    // 4. Clean up the references
    stream = null;
    audioSource = null;
    audioContext = null;

    console.log("Microphone and AudioContext have been shut down.");
  }

  // Stop the animation loop
  cancelAnimationFrame(animationFrameId);
  
});
clearButton.addEventListener('click', () => {

  // visually clear the spectrogram
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
});
