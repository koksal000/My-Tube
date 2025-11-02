"use client";

import { useEffect, useRef } from 'react';

interface SplashScreenProps {
  onVideoEnd: () => void;
}

export function SplashScreen({ onVideoEnd }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const introVideoUrl = "https://files.catbox.moe/pi6yf0.mp4";

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleVideoEnd = () => {
      onVideoEnd();
    };

    videoElement.addEventListener('ended', handleVideoEnd, { once: true });

    const playVideo = async () => {
      try {
        // Ensure video is muted before playing, as most browsers require this for autoplay.
        videoElement.muted = true;
        await videoElement.play();
      } catch (error) {
        console.error("Video autoplay was prevented:", error);
        // If autoplay fails, we should still proceed to the app.
        onVideoEnd();
      }
    };

    // Check if the video is ready, if not, wait for the 'canplay' event.
    if (videoElement.readyState >= 3) {
      playVideo();
    } else {
      videoElement.addEventListener('canplay', playVideo, { once: true });
    }

    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd);
      videoElement.removeEventListener('canplay', playVideo);
    };
  }, [onVideoEnd]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <video
          ref={videoRef}
          src={introVideoUrl}
          playsInline
          muted
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="mt-4 flex items-center space-x-2 text-primary font-bold text-2xl drop-shadow-lg pointer-events-none">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))'}}>My-Tube Reborn</span>
      </div>
    </div>
  );
}
