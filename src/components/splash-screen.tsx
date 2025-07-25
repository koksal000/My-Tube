"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function SplashScreen() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // In a real app, you would check for authentication
      // and redirect to /home if logged in.
      // For this prototype, we'll redirect to login.
      router.push('/login');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video play failed:", error);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative w-64 h-64 md:w-96 md:h-96">
        {/* Background blurred video */}
        <video
          ref={videoRef}
          src="https://files.catbox.moe/aa0k70.mp4"
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-150"
        />
        {/* Foreground video */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-4 ring-primary/20">
          <video
            src="https://files.catbox.moe/aa0k70.mp4"
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            autoPlay
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 text-primary font-bold text-2xl drop-shadow-lg">
           <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
           <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))'}}>My-Tube Reborn</span>
        </div>
      </div>
    </div>
  );
}
