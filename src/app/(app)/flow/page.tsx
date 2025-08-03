"use client";

import { useEffect, useState } from 'react';
import { getAllVideos } from '@/lib/data';
import type { Video } from '@/lib/types';
import FlowPlayer from '@/components/flow-player';
import { Skeleton } from '@/components/ui/skeleton';

export default function FlowPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const allVideos = await getAllVideos();
      // "admin" videosunu, yazarı veya videoURL'i olmayanları ve süresi olmayanları filtrele
      const flowVideos = allVideos
        .filter(v => v.author && v.videoUrl && v.author.username !== 'admin' && v.duration > 0)
        .sort(() => 0.5 - Math.random()); // Rastgele sırala
      setVideos(flowVideos);
      setLoading(false);
    };
    fetchVideos();
  }, []);

  if (loading) {
    return (
       <div className="relative h-[calc(100vh-10rem)] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
         <div className="flex h-full w-full snap-center items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
         </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return <div className="text-center py-20">Akış için video bulunamadı.</div>
  }

  return (
    <div className="relative h-[calc(100vh-10rem)] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
      {videos.map((video) => (
        <div key={video.id} className="relative h-full w-full snap-center flex items-center justify-center rounded-xl overflow-hidden bg-black">
          <FlowPlayer video={video} />
        </div>
      ))}
    </div>
  );
}
