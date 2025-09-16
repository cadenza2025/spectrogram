const startBtn = document.getElementById('startBtn');
const canvas = document.getElementById('spectrogramCanvas');
const stopButton=document.getElementById('stopButton');
const canvasCtx = canvas.getContext('2d');
const axisCanvas = document.getElementById('frequency-axis');
const axisCtx = axisCanvas.getContext('2d')


const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Variables for the audio processing
let audioContext;
let analyser;
let dataArray;
let bufferLength;
let animationFrameId;
let stream
let maxFrequency;



// Color mapping for the spectrogram
const colorMap = (value) => {
 //  Normalize value from 0-255 to 0-360 for HSL hue
 /* const hue = 360 - (value / 255 * 360);
  return `hsl(${hue}, 100%, 50%)`;*/
  const hue = value / 255 * 360;
  if (hue == 0){
  return 'hsl(0, 0%, 0%)';
  }
  else{
  return `hsl(${hue}, 100%, 50%)`;
  }
};
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
  const imageData = canvasCtx.getImageData(1, 0, WIDTH - 1, HEIGHT);
  canvasCtx.putImageData(imageData, 0, 0);

  // Draw the new frequency data as a single vertical line on the right edge
  for (let i = 0; i < bufferLength; i++) {
    const value = dataArray[i];
    const color = colorMap(value);
//    const y = HEIGHT*(5 - Math.log10((i / bufferLength)+1); // Flip the Y-axis for correct frequency display
    const y = HEIGHT - (i / bufferLength) * HEIGHT; // Flip the Y-axis for correct frequency display    
    canvasCtx.fillStyle = color;
    canvasCtx.fillRect(WIDTH - 1, y, 1, 1);
  }
  
};

 // Draw frequency axis
function drawAxis() {
    axisCtx.clearRect(0, 0, axisCanvas.width, axisCanvas.height);
    axisCtx.font = '10px sans-serif';
    axisCtx.fillStyle = 'black';
    axisCtx.textAlign = 'right';

    const labels = [0, 500, 1000, 2000, 4000, 1024, 8000, 16000]; // Target frequencies
            labels.forEach(freq => {
              const normalizedFreq = freq / maxFrequency;
              const y = HEIGHT - normalizedFreq * HEIGHT;

              if (y > 0 && y < HEIGHT) {
                axisCtx.fillText(`${freq} Hz`, axisCanvas.width - 5, y);
              }
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

