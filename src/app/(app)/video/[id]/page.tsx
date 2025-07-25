import { mockVideos, mockUsers } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, BellPlus } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import Image from "next/image";

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

function formatViews(views: number) {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const video = mockVideos.find(v => v.id === params.id);
  const recommendedVideos = mockVideos.filter(v => v.id !== params.id).sort(() => 0.5 - Math.random()).slice(0, 10);

  if (!video) {
    return <div className="text-center py-20">Video not found.</div>;
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
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={video.author.profilePicture} alt={video.author.displayName} data-ai-hint="person face" />
                  <AvatarFallback>{video.author.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{video.author.displayName}</p>
                  <p className="text-sm text-muted-foreground">{video.author.subscribers.toLocaleString()} subscribers</p>
                </div>
                <Button variant="default" className="rounded-full bg-foreground text-background hover:bg-foreground/80">
                  <BellPlus className="mr-2 h-4 w-4" /> Subscribe
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
                  <Share2 className="h-5 w-5" /> Share
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 rounded-xl bg-secondary p-4">
            <p className="font-semibold">{formatViews(video.views)} &bull; {timeAgo(video.createdAt)}</p>
            <p className="mt-2 whitespace-pre-wrap">{video.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">{video.comments.length} Comments</h2>
            {/* Comment Section Placeholder */}
             <div className="text-center text-muted-foreground py-10 rounded-xl bg-secondary">
                <p>Comments are coming soon!</p>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">Up next</h2>
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
