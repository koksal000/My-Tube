"use client";

import { useEffect, useRef } from 'react';

interface SplashScreenProps {
  onVideoEnd: () => void;
}

export function SplashScreen({ onVideoEnd }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Using a more reliable video source if the previous one was problematic.
  // Keeping the original link as per the last successful change.
  const introVideoUrl = "https://files.catbox.moe/pi6yf0.mp4";

  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      // Add the event listener for when the video ends
      videoElement.addEventListener('ended', onVideoEnd);
      
      // Attempt to play the video
      videoElement.play().catch(error => {
        // If autoplay fails (e.g., due to browser policy),
        // we can log the error and immediately trigger the end behavior
        // to not leave the user stuck on the splash screen.
        console.error("Video autoplay failed:", error);
        onVideoEnd();
      });
    }
    
    // Cleanup function to remove the event listener
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('ended', onVideoEnd);
      }
    };
  }, [onVideoEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative w-full h-full max-w-md max-h-screen">
         <video
            ref={videoRef}
            src={introVideoUrl}
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-2 text-primary font-bold text-2xl drop-shadow-lg pointer-events-none">
           <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
           <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))'}}>My-Tube Reborn</span>
        </div>
      </div>
    </div>
  );
}
