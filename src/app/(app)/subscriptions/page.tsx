"use client"

import { VideoCard } from "@/components/video-card";
import { useState, useEffect } from "react";
import type { User, Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { getUserAction, getVideosAction } from "@/app/actions";


export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptionVideos, setSubscriptionVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        if (currentUser.subscriptions && currentUser.subscriptions.length > 0) {
            const subscribedUsers = await Promise.all(currentUser.subscriptions.map(id => getUserAction(id)));
            const subscribedChannelsUsernames = subscribedUsers
                .filter((u): u is User => !!u)
                .map(u => u.username);
            
            const allVideos = await getVideosAction();
            const videos = allVideos.filter(video => 
              video.author && subscribedChannelsUsernames.includes(video.author.username)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setSubscriptionVideos(videos);
        } else {
            setSubscriptionVideos([]);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    fetchSubs();
  }, [router]);

  if(loading) {
      return <div>Abonelikler yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Abonelikler</h1>
      {subscriptionVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subscriptionVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">Henüz hiçbir kanala abone olmadınız.</p>
          <p>Abone olduğunuz kanalların videoları burada görünecek.</p>
        </div>
      )}
    </div>
  );
}
