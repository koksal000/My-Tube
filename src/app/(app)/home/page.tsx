"use client"

import { VideoCard } from "@/components/video-card";
import { generateVideoRecommendations, VideoRecommendationsInput } from "@/ai/flows/video-recommendations";
import React, { useEffect, useState } from "react";
import type { User, Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getAllUsers, getAllVideos, getCurrentUser } from "@/lib/data";

export default function HomePage() {
  const router = useRouter();
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      const allDBVideos = await getAllVideos();
      const allUsers = await getAllUsers();
      
      const allVideosForAI = allDBVideos
        .filter(v => v.author) // Filter out videos without an author
        .map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          username: v.author.username,
          views: v.views,
          likes: v.likes,
          dislikes: v.dislikes,
          commentCount: v.comments.length
      }));

      const recommendationInput: VideoRecommendationsInput = {
        userProfile: {
          username: currentUser.username,
          likedVideos: currentUser.likedVideos,
          viewedVideos: currentUser.viewedVideos,
          subscribedChannels: await Promise.all(currentUser.subscriptions.map(async id => (await getAllUsers()).find(u => u.id === id)?.username || '')),
        },
        allVideos: allVideosForAI,
        boostByViews: 1.2,
        boostByLikes: 1.5,
      };

      try {
        const recommendations = await generateVideoRecommendations(recommendationInput);
        const recommendedVideoIds = recommendations.map(rec => rec.id);
        const sortedVideos = allDBVideos.filter(v => recommendedVideoIds.includes(v.id))
                                      .sort((a, b) => recommendedVideoIds.indexOf(a.id) - recommendedVideoIds.indexOf(b.id));
        setRecommendedVideos(sortedVideos.length > 0 ? sortedVideos : allDBVideos.filter(v => v.author));

      } catch(e) {
        console.error("AI recommendation failed, falling back to all videos", e)
        setRecommendedVideos(allDBVideos.filter(v => v.author));
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [router]);

  if (loading) {
    return <div>Öneriler yükleniyor...</div>
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendedVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
