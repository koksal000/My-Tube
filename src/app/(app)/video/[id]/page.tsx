"use client"

import { getVideoById, getAllVideos, getCurrentUser, updateUser, addCommentToVideo } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Share2, BellPlus, Send, Smile, Film } from "lucide-react";
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

const GiphyViewer = ({ onSelectGif, onSelectEmoji }: { onSelectGif: (url: string) => void, onSelectEmoji: (emoji: string) => void }) => {
    const gifs = [
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWFjZHVrZG5lYjZzeXNlM3B4MnRxaXJ0bWJqaXE3enp6eG5sNm5hayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o72FfM5HJydzafgUE/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG9tbnFjN2YwZWU5a3hpaHQyZzlha3h1aDBlb3FqNmt1ajQzNXplZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8Odq0zzKM596g/giphy.gif',
        'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzY5aWZ2aTNjMnRoNjR2aTZjMWhnaGU0ZGk5bWVmcTN1c3h2d294biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cXblnKZRjFnOE/giphy.gif',
    ];
    const emojis = ['😂', '😍', '👍', '🔥', '❤️', '🤔'];

    return (
        <div className="p-2 border rounded-lg bg-background w-full">
            <h3 className="text-sm font-semibold mb-2">GIF'ler</h3>
            <div className="flex gap-2 mb-2">
                {gifs.map(gif => <img key={gif} src={gif} onClick={() => onSelectGif(gif)} className="w-16 h-16 object-cover cursor-pointer rounded" />)}
            </div>
            <h3 className="text-sm font-semibold mb-2">Emojiler</h3>
            <div className="flex gap-2">
                {emojis.map(emoji => <span key={emoji} onClick={() => onSelectEmoji(emoji)} className="text-2xl cursor-pointer">{emoji}</span>)}
            </div>
        </div>
    )
}

const CommentDisplay = ({ comment }: { comment: Comment }) => {
    const [showGifs, setShowGifs] = useState(true);
     useEffect(() => {
        const savedSetting = localStorage.getItem('myTube-showGifs');
        setShowGifs(savedSetting ? JSON.parse(savedSetting) : true);
    }, []);

    const isGif = comment.text.startsWith('https://media.giphy.com');

    return (
        <div className="flex gap-3">
            <Avatar>
                 <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName} data-ai-hint="person face" />
                <AvatarFallback>{comment.author.displayName.charAt(0)}</AvatarFallback>
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
  const [showGiphy, setShowGiphy] = useState(false);

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

  const handleLike = () => {
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

  const handleSubscription = () => {
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

  const handleAddComment = (text: string) => {
    if (!currentUser || !video || !text.trim()) return;

    const newCommentOmitAuthor: Omit<Comment, 'author'> = {
      id: `comment-${Date.now()}`,
      authorId: currentUser.id,
      text: text,
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
        setShowGiphy(false);

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
  
  if (!video.videoUrl) {
    return <div className="text-center py-20">Video kaynağı bulunamadı veya bozuk.</div>
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
            <video
              key={video.id}
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
                    <div className="relative">
                        <Textarea 
                            placeholder="Yorum ekle..." 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="pr-20"
                        />
                        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setShowGiphy(!showGiphy)}>
                                <Smile className="h-5 w-5" />
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleAddComment(commentText)} disabled={!commentText.trim()}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                     {showGiphy && (
                        <GiphyViewer 
                            onSelectGif={(url) => handleAddComment(url)}
                            onSelectEmoji={(emoji) => setCommentText(prev => prev + emoji)}
                        />
                    )}
                </div>
              </div>
              <div className="space-y-6">
                {video.comments.map(comment => (
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
