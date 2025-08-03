"use client";

import { useEffect, useState } from 'react';
import { getAllVideos, getAllPosts } from '@/lib/data';
import type { Video, Post } from '@/lib/types';
import FlowPlayer from '@/components/flow-player';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';

const FlowPost = ({ post }: { post: Post }) => {
    const { ref, inView } = useInView({ threshold: 0.9 });
    
    if (!post || !post.author) return null;

    return (
        <div ref={ref} className="relative w-full h-full bg-black">
            {post.imageUrl && (
                 <Image src={post.imageUrl} alt={post.caption} layout="fill" objectFit="contain" className="w-full h-full" />
            )}
            <div className="absolute bottom-4 left-4 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                <Link href={`/channel/${post.author.username}`} className="flex items-center gap-2 mb-2">
                    <Avatar>
                        <AvatarImage src={post.author.profilePicture} alt={post.author.displayName || post.author.username} data-ai-hint="person face" />
                        <AvatarFallback>{(post.author.displayName || post.author.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">@{post.author.username}</span>
                </Link>
                <p className="text-sm line-clamp-2">{post.caption}</p>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-4 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                <button className="flex flex-col items-center gap-1">
                    <Heart size={28} />
                    <span className="text-sm font-semibold">{(post.likes || 0).toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <MessageCircle size={28} />
                    <span className="text-sm font-semibold">{(post.comments || []).length}</span>
                </button>
            </div>
        </div>
    )
}

export default function FlowPage() {
  const [content, setContent] = useState<(Video | Post)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const allVideos = await getAllVideos();
      const allPosts = await getAllPosts();
      
      const flowVideos = allVideos
        .filter(v => v.author && v.videoUrl && v.author.username !== 'admin');
      
      const flowPosts = allPosts.filter(p => p.author && p.imageUrl && p.author.username !== 'admin');

      const combinedContent = [...flowVideos, ...flowPosts];
      
      const shuffledContent = combinedContent.sort(() => 0.5 - Math.random());
      
      setContent(shuffledContent);
      setLoading(false);
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
       <div className="relative h-[calc(100vh-10rem)] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
         <div className="flex h-full w-full snap-center items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
         </div>
      </div>
    );
  }

  if (content.length === 0) {
    return <div className="text-center py-20">Akış için içerik bulunamadı.</div>
  }

  return (
    <div className="relative h-[calc(100vh-10rem)] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
      {content.map((item) => (
        <div key={item.id} className="relative h-full w-full snap-center flex items-center justify-center rounded-xl overflow-hidden bg-black">
          {'videoUrl' in item ? <FlowPlayer video={item} /> : <FlowPost post={item} />}
        </div>
      ))}
    </div>
  );
}
