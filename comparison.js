    // BAT AUDIO
    document.getElementById('strawsAudioButton').addEventListener('click', () => {
      playAudio('Righty Calling for Food.wav'); 
      
    });
    document.getElementById('rodsAudioButton').addEventListener('click', () => {
      playAudio('Queen Peach Vocalization.wav');
      
    });

    function playAudio(src) {
      if (!src) return;
      const a = new Audio(src);
      a.play();
    }
    
     // Get the modal element
        const modal = document.getElementById("videoModal");
        const videoPlayer = document.getElementById("videoPlayer");

        // Function to open the modal and load the specific video
        function openModal(videoSource) {
            // Set the video source
            videoPlayer.src = videoSource;
            
            // Display the modal
            modal.style.display = "flex"; 
            
            // Load and attempt to play the video automatically
            videoPlayer.load();
            videoPlayer.play().catch(error => {
                console.error("Autoplay failed:", error);
                // User may need to click play manually if browser blocks autoplay
            });
        }

        // Function to close the modal and stop the video
        function closeModal() {
            // Pause and reset the video player
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
            videoPlayer.src = ""; // Clear the source

            // Hide the modal
            modal.style.display = "none";
        }

        // Optional: Close the modal if the user clicks anywhere outside of the modal content
        window.onclick = function(event) {
            if (event.target == modal) {
                closeModal();
            }
        }


