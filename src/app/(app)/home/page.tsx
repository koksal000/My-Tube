
"use client"

import { VideoCard } from "@/components/video-card";
import { generateVideoRecommendationsAction } from "@/app/actions";
import type { VideoRecommendationsInput } from "@/ai/flows/video-recommendations";
import React, { useEffect, useState } from "react";
import type { Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/lib/db-provider";
import { useAuth } from "@/firebase";

export default function HomePage() {
  const router = useRouter();
  const db = useDatabase();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !db) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      
      if (!firebaseUser) {
        router.push('/login');
        return;
      }
      
      const currentUser = await db.getUser(firebaseUser.uid);
       if (!currentUser) {
        setLoading(false);
        return;
      }

      const allDBVideos = await db.getAllVideos();
      
      const allVideosForAI = allDBVideos
        .filter(v => v.author)
        .map(v => ({
          id: v.id,
          title: v.title,
          description: v.description,
          username: v.author!.username,
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
      
      const recommendations = await generateVideoRecommendationsAction(recommendationInput);
      
      if (recommendations && recommendations.length > 0) {
          const recommendedVideoIds = recommendations.map(rec => rec.id);
          const sortedVideos = allDBVideos.filter(v => recommendedVideoIds.includes(v.id))
                                        .sort((a, b) => recommendedVideoIds.indexOf(a.id) - recommendedVideoIds.indexOf(b.id));
          setRecommendedVideos(sortedVideos);
      } else {
           // Fallback if AI fails or returns no recommendations
           const allNonAdminVideos = allDBVideos.filter(v => v.author && v.author.username !== 'admin');
           const shuffledVideos = allNonAdminVideos.sort(() => 0.5 - Math.random());
           setRecommendedVideos(shuffledVideos);
      }

      setLoading(false);
    };

    fetchRecommendations();
  }, [router, db, firebaseUser, authLoading]);

  if (loading || authLoading || !db) {
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
