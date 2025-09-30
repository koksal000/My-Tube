"use client";

import { useEffect, useState } from 'react';
import type { User, Video, Post, Comment } from '@/lib/types';
import FlowPlayer from '@/components/flow-player';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle } from 'lucide-react';
import { likeContentAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CommentSheet } from '@/components/comment-sheet';
import { useDatabase } from '@/lib/db-provider';

const FlowPost = ({ post, onCommentClick, onLikeClick, isLiked }: { post: Post, onCommentClick: () => void, onLikeClick: () => void, isLiked: boolean }) => {
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
                <button className="flex flex-col items-center gap-1" onClick={onLikeClick}>
                    <Heart size={28} className={isLiked ? 'text-primary fill-primary' : ''} />
                    <span className="text-sm font-semibold">{(post.likes || 0).toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center gap-1" onClick={onCommentClick}>
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedContentForComments, setSelectedContentForComments] = useState<Video | Post | null>(null);
  const { toast } = useToast();
  const db = useDatabase();

   useEffect(() => {
    if (!db) return;
    const fetchContentAndUser = async () => {
      setLoading(true);
      const [user, allVideos, allPosts] = await Promise.all([
        db.getCurrentUser(),
        db.getAllVideos(),
        db.getAllPosts()
      ]);

      setCurrentUser(user);
      
      const flowVideos = allVideos.filter(v => v.author?.videoUrl && v.author?.username !== 'admin');
      const flowPosts = allPosts.filter(p => p.author?.imageUrl && p.author?.username !== 'admin');

      const combinedContent = [...flowVideos, ...flowPosts];
      const shuffledContent = combinedContent.sort(() => 0.5 - Math.random());
      
      setContent(shuffledContent);
      setLoading(false);
    };
    fetchContentAndUser();
  }, [db]);

  const handleLike = async (contentItem: Video | Post) => {
    if (!currentUser || !db) {
        toast({ title: "Giriş Gerekli", description: "Beğenmek için giriş yapmalısınız.", variant: "destructive" });
        return;
    }

    const contentId = contentItem.id;
    const contentType = 'videoUrl' in contentItem ? 'video' : 'post';
    const originalIsLiked = contentType === 'video' 
      ? currentUser.likedVideos?.includes(contentId)
      : currentUser.likedPosts?.includes(contentId);

    // Optimistic UI Update
    const updatedContent = content.map(item => {
        if (item.id === contentId) {
            return { ...item, likes: item.likes + (originalIsLiked ? -1 : 1) };
        }
        return item;
    });
    setContent(updatedContent);

    const updatedUserLikedIds = originalIsLiked
        ? (contentType === 'video' ? currentUser.likedVideos : currentUser.likedPosts)?.filter(id => id !== contentId)
        : [...((contentType === 'video' ? currentUser.likedVideos : currentUser.likedPosts) || []), contentId];
    
    if (contentType === 'video') {
        setCurrentUser(prev => prev ? {...prev, likedVideos: updatedUserLikedIds} : null);
    } else {
        setCurrentUser(prev => prev ? {...prev, likedPosts: updatedUserLikedIds} : null);
    }
    
    try {
      const { updatedContent, updatedUser } = await likeContentAction(contentId, currentUser.id, contentType);
      await db.updateUser(updatedUser);
      if (contentType === 'video') {
        await db.updateVideo(updatedContent as Video);
      } else {
        await db.updatePost(updatedContent as Post);
      }
    } catch (error) {
      toast({ title: "Hata", description: "Beğenme işlemi sırasında bir sorun oluştu.", variant: "destructive" });
      // Revert UI on failure - a more robust implementation would be needed for a real app
       setContent(content);
       setCurrentUser(currentUser);
    }
  };
  
  const handleOpenComments = (contentItem: Video | Post) => {
    setSelectedContentForComments(contentItem);
  };

  const handleCloseComments = () => {
    setSelectedContentForComments(null);
  };

  const handleCommentAdded = (newComment: Comment) => {
    if (selectedContentForComments) {
      const updatedContentList = content.map(item => {
        if (item.id === selectedContentForComments.id) {
          return { ...item, comments: [newComment, ...(item.comments || [])] };
        }
        return item;
      });
      setContent(updatedContentList);
      setSelectedContentForComments(prev => prev ? { ...prev, comments: [newComment, ...(prev.comments || [])] } : null);
    }
  };


  if (loading || !db) {
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
    <>
    <div className="relative h-[calc(100vh-10rem)] w-full max-w-md mx-auto snap-y snap-mandatory overflow-y-scroll scrollbar-hide">
      {content.map((item) => (
        <div key={item.id} className="relative h-full w-full snap-center flex items-center justify-center rounded-xl overflow-hidden bg-black">
          {'videoUrl' in item ? (
            <FlowPlayer 
                video={item} 
                onCommentClick={() => handleOpenComments(item)} 
                onLikeClick={() => handleLike(item)}
                isLiked={currentUser?.likedVideos?.includes(item.id) || false}
            />
          ) : (
             <FlowPost 
                post={item} 
                onCommentClick={() => handleOpenComments(item)}
                onLikeClick={() => handleLike(item)}
                isLiked={currentUser?.likedPosts?.includes(item.id) || false}
             />
          )}
        </div>
      ))}
    </div>
    {selectedContentForComments && currentUser && db && (
        <CommentSheet 
            content={selectedContentForComments}
            currentUser={currentUser}
            db={db}
            isOpen={!!selectedContentForComments}
            onClose={handleCloseComments}
            onCommentAdded={handleCommentAdded}
        />
    )}
    </>
  );
}
