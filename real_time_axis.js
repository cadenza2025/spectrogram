const startBtn    = document.getElementById('startBtn');
const stopBtn     = document.getElementById('stopButton');
const clearBtn    = document.getElementById('clearButton');
const container   = document.getElementById('spectrogram-container');
const canvas      = document.getElementById('spectrogramCanvas');
const axisCanvas  = document.getElementById('frequency-axis');
const ctx         = canvas.getContext('2d');
const axisCtx     = axisCanvas.getContext('2d');
const frequencyCutoff = 8000;
const axisWidth   = 60;
let WIDTH, HEIGHT;
let audioContext, analyser, dataArray, bufferLength;
let animationFrameId, stream, audioSource, maxFreq;
let cutoffIndex;
const MAGMA_STOPS = [
  {t: 0.0, r:0, g:0, b:4},
  {t: 0.25, r:60, g:13, b:91},
  {t:0.5, r:126, g:43, b:114},
  {t:0.75, r:211, g:109, b:95},
  {t:1.0, r:252, g:181, b:62}
];

const bandEdges = [0, 64, 128, 256, 512, 1024, 2048, 4096, 8000]; // 8 bands

function resizeCanvases() {
  const { width: W, height: H } = container.getBoundingClientRect();

  // size axis canvas
  axisCanvas.width  = axisWidth;
  axisCanvas.height = H;

  // size spectrogram canvas
  canvas.width  = Math.floor(W);
  canvas.height = Math.floor(H);

  WIDTH  = canvas.width;
  HEIGHT = canvas.height;
}

window.addEventListener('resize', resizeCanvases);
resizeCanvases();

function colorMap(value) {
  const {r, g, b} = grayToMagma(value);
  return `rgb(${r}, ${g}, ${b})`; // CSS-compatible string
}
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
    async function startSpectrogram() {
      if (audioContext) return;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser     = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      bufferLength    = analyser.frequencyBinCount;
      dataArray       = new Uint8Array(bufferLength);
      maxFreq         = audioContext.sampleRate / 2;
      cutoffIndex = Math.floor((frequencyCutoff / maxFreq) * bufferLength);

      try {
		  const constraints = { 
        	audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true 
        	} 
    	};
        stream     = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioSource = audioContext.createMediaStreamSource(stream);
        audioSource.connect(analyser);
        //analyser.connect(audioContext.destination);

        drawSpectrogram();
        drawAxis();
      } catch (err) {
        console.error('Mic error:', err);
        alert('Could not access microphone. Check permissions.');
      }
    }

    function drawSpectrogram() {
      animationFrameId = requestAnimationFrame(drawSpectrogram);
      analyser.getByteFrequencyData(dataArray);

      // scroll left
      const img = ctx.getImageData(1, 0, WIDTH - 1, HEIGHT);
      ctx.putImageData(img, 0, 0);

      const bandWidth = maxFreq / bufferLength;
      // draw new column on the right
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i];
        const freq=(i/bufferLength)*maxFreq;
        if(freq>frequencyCutoff) continue;
        const yTop = freqToY(freq, canvas.height);
	const yBottom = freqToY(freq + bandWidth, canvas.height);
	let yStart = Math.min(yTop, yBottom);
	let yEnd = Math.max(yTop, yBottom);

	// Ensure minimum height of 1 pixel to avoid collapse
	if (yEnd - yStart < 1) yEnd = yStart + 1;
        
        ctx.fillStyle = colorMap(v);
        ctx.fillRect(WIDTH - 1, yStart, 1, yEnd-yStart);
      }
    }

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


function drawAxis() {
  axisCtx.clearRect(0, 0, axisWidth, HEIGHT);
  axisCtx.font      = '12px sans-serif';
  axisCtx.fillStyle = '#000';
  axisCtx.textAlign = 'right';

  bandEdges.forEach(freq => {
  const y = freqToY(freq, axisCanvas.height);
  axisCtx.fillText(`${freq} Hz`, axisWidth-5, y);

  });

  requestAnimationFrame(drawAxis);
}

startBtn.addEventListener('click', startSpectrogram);

stopBtn.addEventListener('click', () => {
  if (stream && audioSource && audioContext) {
     audioSource.disconnect();
     stream.getTracks().forEach(t => t.stop());
     audioContext.close();
     audioContext = audioSource = stream = null;
     cancelAnimationFrame(animationFrameId);
   }
});

clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
});


