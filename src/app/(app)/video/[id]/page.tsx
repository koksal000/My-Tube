

"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, BellPlus, Film, Heart } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { User, Video, Comment, Post } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { addCommentToAction, likeContentAction, subscribeAction, getVideosAction, getVideoAction, getPostAction, viewContentAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/data";
import { CommentInput } from "@/components/comment-input";
import { ShareDialog } from "@/components/share-dialog";

function timeAgo(dateString: string) {
    if (!dateString) return "";
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
    if(isNaN(views)) return "0 izlenme";
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)} Milyar izlenme`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M izlenme`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}B izlenme`;
    return `${views} izlenme`;
}

const CommentDisplay = ({ comment }: { comment: Comment }) => {
    const [showGifs, setShowGifs] = useState(true);
     useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSetting = localStorage.getItem('myTube-showGifs');
            setShowGifs(savedSetting ? JSON.parse(savedSetting) : true);
        }
    }, []);

    if (!comment || !comment.author) {
        return <div className="flex gap-3">Yorum Yükleniyor...</div>;
    }

    const isGif = comment.text.startsWith('http') && (comment.text.endsWith('.gif') || comment.text.endsWith('.webp'));


    return (
        <div className="flex gap-3">
            <Avatar>
                 <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName || comment.author.username} data-ai-hint="person face" />
                <AvatarFallback>{(comment.author.displayName || comment.author.username || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">@{comment.author.username}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</p>
                </div>
                {isGif ? (
                    showGifs ? (
                        <img src={comment.text} alt="Yorum GIF'i" className="mt-2 rounded-lg max-w-xs" />
                    ) : (
                        <div className="mt-2 p-2 border rounded-md bg-secondary text-muted-foreground text-sm flex items-center gap-2">
                           <Film className="h-4 w-4" /> GIF
                        </div>
                    )
                ) : (
                    <p>{comment.text}</p>
                )}
            </div>
        </div>
    )
}

function VideoPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const contentType = searchParams.get('type') || 'video';
  const router = useRouter();
  const { toast } = useToast();
  
  const [content, setContent] = useState<Video | Post | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const isVideo = contentType === 'video' && content && 'videoUrl' in content;
  const isPost = contentType === 'post' && content && 'imageUrl' in content;

  const author = content?.author;
  const isIntroVideo = author?.username === 'admin';

  useEffect(() => {
    const fetchContentData = async () => {
        if (!params.id) return;
        setLoading(true);

        const loggedInUser = await getCurrentUser();
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        setCurrentUser(loggedInUser);

        let contentData: Video | Post | null = null;
        if (contentType === 'video') {
            contentData = await getVideoAction(params.id as string);
        } else {
            contentData = await getPostAction(params.id as string);
        }

        if (contentData) {
            setContent(contentData);

            if(isVideo && loggedInUser) {
                // Increment view count
                viewContentAction(contentData.id, 'video', loggedInUser.id);
            }

            if (contentData.author) {
              setIsSubscribed((loggedInUser.subscriptions || []).includes(contentData.author.id));
            }

             if (isVideo) {
                setIsLiked((loggedInUser.likedVideos || []).includes(contentData.id));
                const allVideos = (await getVideosAction()).filter(v => v.author && v.author.username !== 'admin');
                const recs = allVideos.filter(v => v.id !== params.id).sort(() => 0.5 - Math.random()).slice(0, 10);
                setRecommendedVideos(recs);
            } else if (isPost) {
                 setIsLiked((loggedInUser.likedPosts || []).includes(contentData.id));
            }
        } else {
            toast({ title: "İçerik Bulunamadı", variant: "destructive" });
            router.push("/home");
        }
        setLoading(false);
    }
    fetchContentData();
  }, [params.id, router, contentType, toast]);

  const handleLike = async () => {
    if (!currentUser || !content) return;
    
    const contentId = content.id;
    const contentTypeForAction = isVideo ? 'video' : 'post';
    const newIsLiked = !isLiked;

    // Optimistic UI Update
    setIsLiked(newIsLiked);
    setContent(prev => prev ? { ...prev, likes: prev.likes + (newIsLiked ? 1 : -1) } : null);
    
    try {
      await likeContentAction(contentId, currentUser.id, contentTypeForAction);
      
      // Refetch user data to ensure state is in sync
      const updatedUser = await getCurrentUser();
      setCurrentUser(updatedUser);

    } catch (e) {
      // Revert UI on failure
      setIsLiked(!newIsLiked);
      setContent(prev => prev ? { ...prev, likes: prev.likes - (newIsLiked ? 1 : -1) } : null);
      toast({ title: "Hata", description: "Beğenme işlemi sırasında bir sorun oluştu.", variant: "destructive" });
    }
  };

  const handleSubscription = async () => {
     if (!currentUser || !author || isIntroVideo) return;
     
     const newIsSubscribed = !isSubscribed;
     
     // Optimistic UI Update
     setIsSubscribed(newIsSubscribed);
     if (author) {
        setContent(prev => {
            if(!prev || !prev.author) return prev;
            return {
                ...prev,
                author: {
                    ...prev.author,
                    subscribers: prev.author.subscribers + (newIsSubscribed ? 1 : -1)
                }
            }
        });
     }

     try {
        await subscribeAction(currentUser.id, author.id);
        const updatedUser = await getCurrentUser();
        setCurrentUser(updatedUser);

        toast({
            title: newIsSubscribed ? "Abone Olundu!" : "Abonelikten Çıkıldı",
            description: newIsSubscribed ? `${author.displayName || author.username} kanalına başarıyla abone oldunuz.` : `${author.displayName || author.username} kanalından aboneliğinizi kaldırdınız.`,
        });
        
     } catch (error) {
        // Revert UI
        setIsSubscribed(!newIsSubscribed);
         if (author) {
            setContent(prev => {
                if(!prev || !prev.author) return prev;
                return {
                    ...prev,
                    author: {
                        ...prev.author,
                        subscribers: prev.author.subscribers - (newIsSubscribed ? 1 : -1)
                    }
                }
            });
         }
        toast({ title: "Hata", description: "Abonelik işlemi sırasında bir hata oluştu.", variant: "destructive" });
     }
  };

  const handleAddComment = async (text: string) => {
    if (!currentUser || !content || !text.trim()) return false;
    
    const contentTypeForAction = isVideo ? 'video' : 'post';
    const newComment = await addCommentToAction(content.id, contentTypeForAction, currentUser.id, text);
    
    const newContent = {...content, comments: [newComment, ...(content.comments || [])] } as Video | Post
    setContent(newContent);
    
    toast({ title: "Yorum Eklendi", description: "Yorumunuz başarıyla gönderildi." });
    return true; // Indicate success to clear the input
  };

  if (loading || !content) {
    return <div className="text-center py-20">İçerik yükleniyor...</div>;
  }

  if (!author && !isIntroVideo) {
     return <div className="text-center py-20">İçerik sahibi bulunamadı.</div>;
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            
            {isVideo && (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
                    <video
                    key={content.id}
                    src={(content as Video).videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full"
                    poster={(content as Video).thumbnailUrl}
                    />
                </div>
            )}

            {isPost && (content as Post).imageUrl && (
                <Card>
                    <CardContent className="p-0">
                        <Image src={(content as Post).imageUrl} alt={(content as Post).caption} width={1280} height={720} className="w-full h-auto rounded-t-xl" />
                    </CardContent>
                </Card>
            )}

          <div className="py-4">
            <h1 className="text-2xl font-bold">{isVideo ? (content as Video).title : (content as Post).caption}</h1>
            {!isIntroVideo && author && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                    <AvatarImage src={author.profilePicture} alt={author.displayName || author.username} data-ai-hint="person face" />
                    <AvatarFallback>{(author.displayName || author.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-semibold">{author.displayName || author.username}</p>
                    <p className="text-sm text-muted-foreground">{(author.subscribers || 0).toLocaleString()} abone</p>
                    </div>
                    <Button variant={isSubscribed ? "secondary" : "default"} className="rounded-full" onClick={handleSubscription}>
                        <BellPlus className="mr-2 h-4 w-4" /> {isSubscribed ? 'Abone Olundu' : 'Abone Ol'}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {isVideo && (
                        <Button variant="secondary" className="rounded-full gap-2 px-4" onClick={handleLike}>
                            <ThumbsUp className={`h-5 w-5 ${isLiked ? 'text-primary fill-primary' : ''}`} /> {(content.likes || 0).toLocaleString()}
                        </Button>
                    )}
                    {isPost && (
                         <Button variant="secondary" className="rounded-full gap-2 px-4" onClick={handleLike}>
                            <Heart className={`h-5 w-5 ${isLiked ? 'text-primary fill-primary' : ''}`} /> {(content.likes || 0).toLocaleString()}
                        </Button>
                    )}
                    {content && <ShareDialog content={content} />}
                </div>
                </div>
            )}
          </div>
          
          <div className="mt-4 rounded-xl bg-secondary p-4">
            {!isIntroVideo && isVideo && (
                <p className="font-semibold">{formatViews((content as Video).views)} &bull; {timeAgo(content.createdAt)}</p>
            )}
             {!isIntroVideo && isPost && (
                <p className="font-semibold">{(content.likes || 0).toLocaleString()} beğeni &bull; {timeAgo(content.createdAt)}</p>
            )}
            <p className="mt-2 whitespace-pre-wrap">{isVideo ? (content as Video).description : (content as Post).caption}</p>
          </div>

          {!isIntroVideo && currentUser && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">{(content.comments || []).length} Yorum</h2>
              <div className="flex gap-4 mb-6">
                <Avatar>
                    <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.displayName || currentUser?.username} data-ai-hint="person face" />
                    <AvatarFallback>{(currentUser?.displayName || currentUser?.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <CommentInput
                  onSubmit={handleAddComment}
                />
              </div>
              <div className="space-y-6">
                {(content.comments || []).map(comment => (
                    <CommentDisplay key={comment.id} comment={comment} />
                ))}
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

export default function VideoPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Yükleniyor...</div>}>
            <VideoPageClient />
        </Suspense>
    )
}
