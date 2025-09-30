"use client"

import { VideoCard } from "@/components/video-card";
import { generateVideoRecommendations, VideoRecommendationsInput } from "@/ai/flows/video-recommendations";
import React, { useEffect, useState } from "react";
import type { Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/lib/db";

export default function HomePage() {
  const router = useRouter();
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useDatabase();

  useEffect(() => {
    if (!db) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      const currentUser = await db.getCurrentUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      const allDBVideos = await db.getAllVideos();
      
      const allVideosForAI = allDBVideos
        .filter(v => v.author) // Filter out videos without an author
        .map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          username: v.author.username,
          views: v.views,
          likes: v.likes,
          commentCount: (v.comments || []).length
      }));

      const subscribedUsers = await Promise.all((currentUser.subscriptions || []).map(id => db.getUser(id)));
      const subscribedUsernames = subscribedUsers.filter(Boolean).map(u => u!.username);

      const recommendationInput: VideoRecommendationsInput = {
        userProfile: {
          username: currentUser.username,
          likedVideos: currentUser.likedVideos || [],
          viewedVideos: currentUser.viewedVideos || [],
          subscribedChannels: subscribedUsernames,
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
        const allNonAdminVideos = allDBVideos.filter(v => v.author && v.author.username !== 'admin');
        const shuffledVideos = allNonAdminVideos.sort(() => 0.5 - Math.random());
        setRecommendedVideos(shuffledVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [router, db]);

  if (loading || !db) {
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
