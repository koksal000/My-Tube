"use client"

import { VideoCard } from "@/components/video-card";
import { getAllVideos } from "@/lib/db";
import type { Video } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ExplorePage() {
  const [exploreVideos, setExploreVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const allVideos = await getAllVideos();
      // admin videosunu keşfetten çıkar
      const filteredVideos = allVideos.filter(v => v.author.username !== 'admin');
      // Videoları karıştır
      const shuffled = [...filteredVideos].sort(() => 0.5 - Math.random());
      setExploreVideos(shuffled);
      setLoading(false);
    }
    fetchVideos();
  }, []);

  if (loading) {
    return <div>Videolar yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Keşfet</h1>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exploreVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
