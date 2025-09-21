    // BAT AUDIO + SPECTROGRAM
    document.getElementById('feedingButton').addEventListener('click', () => {
      playAudio('10006.wav'); 
      
    });
    document.getElementById('fightingButton').addEventListener('click', () => {
      playAudio('10449.wav');
      
    });

    function playAudio(src) {
      if (!src) return;
      const a = new Audio(src);
      a.play();
    }
    


