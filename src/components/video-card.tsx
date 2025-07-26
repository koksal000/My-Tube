import type { Video } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function formatDuration(seconds: number) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M izlenme`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}B izlenme`;
    return `${views} izlenme`;
}

export function VideoCard({ video }: { video: Video }) {
  const isIntroVideo = video.author?.username === 'admin';

  return (
    <div className="group">
      <Link href={`/video/${video.id}`}>
        <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300"
            data-ai-hint="video thumbnail"
          />
          {!isIntroVideo && (
            <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
                {formatDuration(video.duration)}
            </div>
          )}
        </div>
      </Link>
      <div className="flex gap-3">
        {!isIntroVideo && (
          <Link href={`/channel/${video.author.username}`}>
              <Avatar>
              <AvatarImage src={video.author.profilePicture} alt={video.author.displayName} data-ai-hint="person face" />
              <AvatarFallback>{video.author.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
          </Link>
        )}
        <div>
          <h3 className="font-semibold leading-snug">
            <Link href={`/video/${video.id}`} className="line-clamp-2">
              {video.title}
            </Link>
          </h3>
          {!isIntroVideo && (
            <>
                <p className="text-sm text-muted-foreground">
                    <Link href={`/channel/${video.author.username}`} className="hover:text-foreground">
                    {video.author.displayName}
                    </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                    {formatViews(video.views)} &bull; {timeAgo(video.createdAt)}
                </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
