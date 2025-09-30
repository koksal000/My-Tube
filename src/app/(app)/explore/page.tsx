"use client"

import { VideoCard } from "@/components/video-card";
import type { Video, Post } from "@/lib/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useDatabase } from "@/lib/db-provider";

// A component for displaying posts in the explore grid
const PostCard = ({ post }: { post: Post }) => (
  <Link href={`/video/${post.id}?type=post`} className="group">
      <Card className="overflow-hidden h-full flex flex-col">
          <div className="relative w-full aspect-video">
            {post.imageUrl && <Image src={post.imageUrl} alt={post.caption} fill className="object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="user post" />}
          </div>
          <CardContent className="p-4 flex-grow">
              <p className="line-clamp-3 font-semibold">{post.caption}</p>
              {post.author && (
                 <p className="text-sm text-muted-foreground mt-2">@{post.author.username}</p>
              )}
          </CardContent>
      </Card>
    </Link>
);


export default function ExplorePage() {
  const [exploreContent, setExploreContent] = useState<(Video | Post)[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useDatabase();

  useEffect(() => {
    if (!db) return;

    const fetchContent = async () => {
      setLoading(true);
      const allVideos = await db.getAllVideos();
      const allPosts = await db.getAllPosts();
      
      const filteredVideos = allVideos.filter(v => v.author?.username !== 'admin');
      const filteredPosts = allPosts.filter(p => p.author?.username !== 'admin');
      
      const combinedContent = [...filteredVideos, ...filteredPosts];
      
      const shuffled = [...combinedContent].sort(() => 0.5 - Math.random());
      setExploreContent(shuffled);
      setLoading(false);
    }
    fetchContent();
  }, [db]);

  if (loading) {
    return <div>İçerikler yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Keşfet</h1>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exploreContent.map(content => {
          if ('videoUrl' in content) { // It's a Video
            return <VideoCard key={`video-${content.id}`} video={content} />
          } else { // It's a Post
            return <PostCard key={`post-${content.id}`} post={content} />
          }
        })}
      </div>
    </div>
  );
}
