"use client"

import { getVideoById, getAllVideos } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, BellPlus } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Video } from "@/lib/types";

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika önce";
    return "az önce";
}

function formatViews(views: number) {
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)} Milyar izlenme`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)} M izlenme`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)} B izlenme`;
    return `${views} izlenme`;
}

export default function VideoPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const isIntroVideo = video?.author?.username === 'admin';

  useEffect(() => {
    const fetchVideoData = async () => {
        if (!params.id) return;
        setLoading(true);

        const videoData = await getVideoById(params.id as string);
        if (videoData) {
            setVideo(videoData);
             // Sadece admin olmayan videoları öner
            const allVideos = (await getAllVideos()).filter(v => v.author.username !== 'admin');
            const recs = allVideos.filter(v => v.id !== params.id).sort(() => 0.5 - Math.random()).slice(0, 10);
            setRecommendedVideos(recs);
        }
        setLoading(false);
    }
    fetchVideoData();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-20">Video yükleniyor...</div>;
  }

  if (!video) {
    return <div className="text-center py-20">Video bulunamadı.</div>;
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="h-full w-full"
              poster={video.thumbnailUrl}
            />
          </div>

          <div className="py-4">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            {!isIntroVideo && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                    <AvatarImage src={video.author.profilePicture} alt={video.author.displayName} data-ai-hint="person face" />
                    <AvatarFallback>{video.author.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-semibold">{video.author.displayName}</p>
                    <p className="text-sm text-muted-foreground">{video.author.subscribers.toLocaleString()} abone</p>
                    </div>
                    <Button variant="default" className="rounded-full bg-foreground text-background hover:bg-foreground/80">
                        <BellPlus className="mr-2 h-4 w-4" /> Abone Ol
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full bg-secondary">
                    <Button variant="ghost" className="rounded-l-full gap-2 pl-4 pr-3">
                        <ThumbsUp className="h-5 w-5" /> {video.likes.toLocaleString()}
                    </Button>
                    <div className="h-6 w-px bg-border"></div>
                    <Button variant="ghost" className="rounded-r-full pl-3 pr-4">
                        <ThumbsDown className="h-5 w-5" />
                    </Button>
                    </div>
                    <Button variant="ghost" className="rounded-full gap-2">
                    <Share2 className="h-5 w-5" /> Paylaş
                    </Button>
                </div>
                </div>
            )}
          </div>
          
          <div className="mt-4 rounded-xl bg-secondary p-4">
            {!isIntroVideo && (
                <p className="font-semibold">{formatViews(video.views)} &bull; {timeAgo(video.createdAt)}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap">{video.description}</p>
          </div>

          {!isIntroVideo && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">{video.comments.length} Yorum</h2>
              {/* Comment Section Placeholder */}
              <div className="text-center text-muted-foreground py-10 rounded-xl bg-secondary">
                  <p>Yorumlar yakında geliyor!</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">Sıradaki</h2>
            <div className="space-y-4">
                {recommendedVideos.map(recVideo => (
                    <VideoCard key={recVideo.id} video={recVideo} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
