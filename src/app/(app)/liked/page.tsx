"use client"

import { VideoCard } from "@/components/video-card";
import { useState, useEffect } from "react";
import type { Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { getVideoAction } from "@/app/actions";

export default function LikedPage() {
  const router = useRouter();
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        if (currentUser.likedVideos && currentUser.likedVideos.length > 0) {
            const userLikedVideos = await Promise.all(currentUser.likedVideos.map(id => getVideoAction(id)));
            setLikedVideos(userLikedVideos.filter((v): v is Video => !!v));
        } else {
            setLikedVideos([]);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    fetchLikedVideos();
  }, [router]);

  if (loading) {
      return <div>Beğenilen videolar yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Beğenilen Videolar</h1>
      {likedVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likedVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">Henüz hiç video beğenmediniz.</p>
          <p>Beğendiğiniz videolar burada görünecek.</p>
        </div>
      )}
    </div>
  );
}
