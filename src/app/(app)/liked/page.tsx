"use client"

import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/data";
import { useState, useEffect } from "react";
import type { User, Video } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function LikedPage() {
  const router = useRouter();
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const currentUser: User = JSON.parse(storedUser);
      // Filter all videos to find those whose IDs are in the user's likedVideos list
      const userLikedVideos = mockVideos.filter(video => currentUser.likedVideos.includes(video.id));
      setLikedVideos(userLikedVideos);
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Liked Videos</h1>
      {likedVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likedVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">You haven't liked any videos yet.</p>
          <p>Your liked videos will appear here.</p>
        </div>
      )}
    </div>
  );
}
