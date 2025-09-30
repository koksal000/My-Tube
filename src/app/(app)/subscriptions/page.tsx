"use client"

import { VideoCard } from "@/components/video-card";
import { useState, useEffect } from "react";
import type { Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/lib/db-provider";


export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptionVideos, setSubscriptionVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useDatabase();

  useEffect(() => {
    if (!db) return;
    const fetchSubs = async () => {
      setLoading(true);
      const currentUser = await db.getCurrentUser();
      
      if (currentUser) {
        if (currentUser.subscriptions && currentUser.subscriptions.length > 0) {
            const allVideos = await db.getAllVideos();
            const videos = allVideos.filter(video => 
              video.author && currentUser.subscriptions.includes(video.authorId)
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
  }, [router, db]);

  if(loading || !db) {
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
