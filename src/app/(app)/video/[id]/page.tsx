"use client"

import { getVideoById, getAllVideos, getCurrentUser, updateUser, addCommentToVideo, addVideo } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, BellPlus } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User, Video, Comment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M izlenme`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}B izlenme`;
    return `${views} izlenme`;
}

export default function VideoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  const isIntroVideo = video?.author?.username === 'admin';

  useEffect(() => {
    const fetchVideoData = async () => {
        if (!params.id) return;
        setLoading(true);

        const loggedInUser = getCurrentUser();
        if (!loggedInUser) {
          router.push('/login');
          return;
        }
        setCurrentUser(loggedInUser);

        const videoData = getVideoById(params.id as string);
        if (videoData) {
            setVideo(videoData);
            setIsLiked(loggedInUser.likedVideos.includes(videoData.id));
            if (videoData.author) {
              setIsSubscribed(loggedInUser.subscriptions.includes(videoData.author.id));
            }

            const allVideos = (getAllVideos()).filter(v => v.author.username !== 'admin');
            const recs = allVideos.filter(v => v.id !== params.id).sort(() => 0.5 - Math.random()).slice(0, 10);
            setRecommendedVideos(recs);
        }
        setLoading(false);
    }
    fetchVideoData();
  }, [params.id, router]);

  const handleLike = async () => {
    if (!currentUser || !video) return;

    let updatedLikedVideos = [...currentUser.likedVideos];
    let videoToUpdate = {...video};
    
    if (isLiked) {
      updatedLikedVideos = updatedLikedVideos.filter(id => id !== video.id);
      videoToUpdate.likes--;
    } else {
      updatedLikedVideos.push(video.id);
      videoToUpdate.likes++;
    }

    try {
      const updatedUser = { ...currentUser, likedVideos: updatedLikedVideos };
      updateUser(updatedUser);
      // The video data is also "updated" in memory
      setVideo(videoToUpdate); 
      setCurrentUser(updatedUser);
      setIsLiked(!isLiked);
    } catch (e) {
      toast({ title: "Hata", description: "Beğenme işlemi sırasında bir sorun oluştu.", variant: "destructive" });
    }
  };

  const handleSubscription = async () => {
     if (!currentUser || !video?.author) return;
     
     let updatedSubscriptions = [...currentUser.subscriptions];
     let updatedChannelUser = {...video.author};

     if (isSubscribed) {
        updatedSubscriptions = updatedSubscriptions.filter(id => id !== video.author.id);
        updatedChannelUser.subscribers--;
     } else {
        updatedSubscriptions.push(video.author.id);
        updatedChannelUser.subscribers++;
     }
    
     const updatedCurrentUser = {...currentUser, subscriptions: updatedSubscriptions};
     
     updateUser(updatedCurrentUser);
     updateUser(updatedChannelUser);

     setCurrentUser(updatedCurrentUser);
     setIsSubscribed(!isSubscribed);
     setVideo({...video, author: updatedChannelUser}); // update video state with new author data
     
     toast({
        title: isSubscribed ? "Abonelikten Çıkıldı" : "Abone Olundu!",
        description: isSubscribed ? `${video.author.displayName} kanalından aboneliğinizi kaldırdınız.` : `${video.author.displayName} kanalına başarıyla abone oldunuz.`,
      });
      
      router.refresh();
  };

  const handleAddComment = async () => {
    if (!currentUser || !video || !commentText.trim()) return;

    const newCommentOmitAuthor: Omit<Comment, 'author'> = {
      id: `comment-${Date.now()}`,
      authorId: currentUser.id,
      text: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };
    
    try {
        addCommentToVideo(video.id, newCommentOmitAuthor);
        
        // Optimistically update UI
        const hydratedComment: Comment = { ...newCommentOmitAuthor, author: currentUser, replies: [] };
        setVideo({ ...video, comments: [hydratedComment, ...video.comments] });
        setCommentText("");

        toast({ title: "Yorum Eklendi", description: "Yorumunuz başarıyla gönderildi." });

    } catch(e) {
        toast({ title: "Hata", description: "Yorum eklenirken bir sorun oluştu.", variant: "destructive" });
    }
  };

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
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-black shadow-lg">
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
                    <Button variant={isSubscribed ? "secondary" : "default"} className="rounded-full" onClick={handleSubscription}>
                        <BellPlus className="mr-2 h-4 w-4" /> {isSubscribed ? 'Abone Olundu' : 'Abone Ol'}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-full bg-secondary">
                    <Button variant="ghost" className="rounded-l-full gap-2 pl-4 pr-3" onClick={handleLike}>
                        <ThumbsUp className={`h-5 w-5 ${isLiked ? 'text-primary fill-primary' : ''}`} /> {video.likes.toLocaleString()}
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
              <div className="flex gap-4 mb-6">
                <Avatar>
                    <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.displayName} data-ai-hint="person face" />
                    <AvatarFallback>{currentUser?.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-2">
                    <Textarea 
                        placeholder="Yorum ekle..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setCommentText("")}>İptal</Button>
                        <Button onClick={handleAddComment} disabled={!commentText.trim()}>Yorum Yap</Button>
                    </div>
                </div>
              </div>
              <div className="space-y-6">
                {video.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                        <Avatar>
                             <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName} data-ai-hint="person face" />
                            <AvatarFallback>{comment.author.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">@{comment.author.username}</p>
                                <p className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</p>
                            </div>
                            <p>{comment.text}</p>
                        </div>
                    </div>
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
