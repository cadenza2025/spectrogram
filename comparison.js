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
    
   // Create a new Image element
    const humanImg = document.createElement("img");

  // Set the source of the image (replace 'path/to/your/image.png' with the actual path)
    humanImg.src = "hello_world.png"; 


  // Get the container element where you want to display the image
    const humanImgContainer = document.getElementById("humanSpectrogram");

  // Append the image to the container
    humanImgContainer.appendChild(humanImg);
    
    // Create a new Image element
    const feedingImg = document.createElement("img");

  // Set the source of the image (replace 'path/to/your/image.png' with the actual path)
    feedingImg.src = "sg10006-0-feeding.png"; 


  // Get the container element where you want to display the image
    const feedingImgContainer = document.getElementById("feedingSpectrogram");

  // Append the image to the container
    feedingImgContainer.appendChild(feedingImg);
    
    // Create a new Image element
    const fightingImg = document.createElement("img");

  // Set the source of the image (replace 'path/to/your/image.png' with the actual path)
    fightingImg.src = "sg10449-1-fighting.png"; 


  // Get the container element where you want to display the image
    const fightingImgContainer = document.getElementById("fightingSpectrogram");

  // Append the image to the container
    fightingImgContainer.appendChild(fightingImg);
    

