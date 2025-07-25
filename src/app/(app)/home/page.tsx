"use client"
import { VideoCard } from "@/components/video-card";
import { mockVideos, mockUsers } from "@/lib/data";
import { generateVideoRecommendations, VideoRecommendationsInput } from "@/ai/flows/video-recommendations";
import React, { useEffect, useState } from "react";
import type { User, Video } from "@/lib/types";
import { useRouter } from "next/navigation";

// This is now a client component to handle user state
export default function HomePage() {
  const router = useRouter();
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>(mockVideos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const storedUser = localStorage.getItem("currentUser");
      const storedUsers = localStorage.getItem("myTubeUsers");
      
      if (!storedUser) {
        router.push('/login');
        return;
      }

      const currentUser: User = JSON.parse(storedUser);
      const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
      
      const allVideosForAI = mockVideos.map(v => ({
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
          subscribedChannels: currentUser.subscriptions.map(id => allUsers.find(u => u.id === id)?.username || ''),
        },
        allVideos: allVideosForAI,
        boostByViews: 1.2,
        boostByLikes: 1.5,
      };

      try {
        const recommendations = await generateVideoRecommendations(recommendationInput);
        const recommendedVideoIds = recommendations.map(rec => rec.id);
        const sortedVideos = mockVideos.filter(v => recommendedVideoIds.includes(v.id))
                                      .sort((a, b) => recommendedVideoIds.indexOf(a.id) - recommendedVideoIds.indexOf(b.id));
        setRecommendedVideos(sortedVideos);

      } catch(e) {
        console.error("AI recommendation failed, falling back to mock data", e)
        // Fallback to all videos if AI fails
        setRecommendedVideos(mockVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [router]);

  if (loading) {
    return <div>Loading recommendations...</div>
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
