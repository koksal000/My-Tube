"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Trash2, Reply, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { VideoCard } from "@/components/video-card";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { User, Video, Comment, Post } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { addCommentToAction, addReplyToAction, likeContentAction, subscribeAction, viewContentAction, deleteContentAction, deleteCommentAction } from "@/app/actions";
import { CommentInput } from "@/components/comment-input";
import { ShareDialog } from "@/components/share-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDatabase } from "@/lib/db";
import Link from "next/link";

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

const CommentDisplay = ({ comment, currentUser, content, onReply, onDelete, parentCommentId }: { comment: Comment, currentUser: User, content: Video | Post, onReply: (parentCommentId: string, reply: Comment) => void, onDelete: (commentId: string, parentCommentId?: string) => void, parentCommentId?: string }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const { toast } = useToast();
    const db = useDatabase();
    
    if (!comment || !comment.author || !db) {
        return <div className="flex gap-3">Yorum Yükleniyor...</div>;
    }

    const handleAddReply = async (text: string) => {
        const contentTypeForAction = 'videoUrl' in content ? 'video' : 'post';
        try {
            const newReply = await addReplyToAction(content.id, contentTypeForAction, comment.id, currentUser.id, text);
            await db.addReplyToComment(parentCommentId || comment.id, newReply);
            onReply(comment.id, newReply);
            setShowReplyInput(false);
            toast({ title: "Yanıt Eklendi" });
            return true;
        } catch (error) {
            toast({ title: "Hata", description: "Yanıt eklenemedi.", variant: "destructive" });
            return false;
        }
    };
    
    const canDelete = currentUser.id === comment.author.id || currentUser.id === content.authorId;
    const isGif = comment.text.startsWith('http') && (comment.text.endsWith('.gif') || comment.text.endsWith('.webp') || comment.text.endsWith('.png') || comment.text.endsWith('.jpg'));

    return (
        <div className="flex gap-3">
            <Avatar>
                 <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName || comment.author.username} data-ai-hint="person face" />
                <AvatarFallback>{(comment.author.displayName || comment.author.username || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">@{comment.author.username}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</p>
                </div>
                {isGif ? (
                     <img src={comment.text} alt="Yorum GIF'i" className="mt-2 rounded-lg max-w-xs" />
                ) : (
                    <p>{comment.text}</p>
                )}
                <div className="mt-1 flex items-center gap-2">
                   <Button variant="ghost" size="sm" onClick={() => setShowReplyInput(!showReplyInput)}>
                      <Reply className="h-3 w-3 mr-1"/> Yanıtla
                    </Button>
                    {canDelete && (
                         <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(comment.id, parentCommentId)}>
                            <Trash2 className="h-3 w-3 mr-1"/> Sil
                        </Button>
                    )}
                </div>

                {showReplyInput && (
                    <div className="mt-2 flex items-start gap-2">
                        <Avatar className="w-8 h-8">
                             <AvatarImage src={currentUser.profilePicture} alt={currentUser.displayName || currentUser.username} data-ai-hint="person face" />
                             <AvatarFallback>{(currentUser.displayName || currentUser.username || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CommentInput onSubmit={handleAddReply} />
                    </div>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2">
                        {comment.replies.map(reply => (
                           <CommentDisplay 
                                key={reply.id} 
                                comment={reply}
                                currentUser={currentUser} 
                                content={content} 
                                onReply={onReply}
                                onDelete={onDelete}
                                parentCommentId={comment.id}
                           />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const PostContent = ({ post, currentUser, onLike, onComment, isLiked, isSubscribed, onSubscribe, onDelete }: { 
    post: Post; 
    currentUser: User | null; 
    onLike: () => void;
    onComment: () => void;
    isLiked: boolean;
    isSubscribed: boolean;
    onSubscribe: () => void;
    onDelete: () => void;
}) => {
    if (!post.author) return null;
    const isOwnPost = currentUser?.id === post.authorId;
    return (
        <Card className="max-w-3xl mx-auto">
            <CardContent className="p-0">
                {post.imageUrl && (
                    <div className="relative w-full aspect-video bg-secondary">
                        <Image src={post.imageUrl} alt={post.caption} layout="fill" className="object-contain" data-ai-hint="user post" />
                    </div>
                )}
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-4">
                        <Link href={`/channel/${post.author.username}`}>
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={post.author.profilePicture} alt={post.author.displayName || post.author.username} data-ai-hint="person face"/>
                                <AvatarFallback>{(post.author.displayName || post.author.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-grow">
                             <div className="flex items-center justify-between">
                                <div>
                                    <Link href={`/channel/${post.author.username}`} className="font-semibold hover:underline">{post.author.displayName || post.author.username}</Link>
                                    <p className="text-sm text-muted-foreground">{post.author.subscribers.toLocaleString()} abone</p>
                                </div>
                                {!isOwnPost && currentUser && (
                                     <Button onClick={onSubscribe} variant={isSubscribed ? 'secondary' : 'default'} className="rounded-full">
                                        {isSubscribed ? 'Abonelikten Çık' : 'Abone Ol'}
                                    </Button>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    <p className="whitespace-pre-wrap">{post.caption}</p>
                    <p className="text-sm text-muted-foreground">{timeAgo(post.createdAt)}</p>

                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                            <Button variant="ghost" className="rounded-full gap-2" onClick={onLike}>
                                <Heart className={isLiked ? "text-primary fill-primary" : ""} /> {post.likes.toLocaleString()}
                            </Button>
                            <Button variant="ghost" className="rounded-full gap-2" onClick={onComment}>
                                <MessageSquare className="h-5 w-5" /> {post.comments.length.toLocaleString()}
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            {isOwnPost && (
                                <Button variant="ghost" className="rounded-full gap-2 text-destructive hover:text-destructive" onClick={onDelete}>
                                    <Trash2 className="h-5 w-5" /> Sil
                                </Button>
                            )}
                            <ShareDialog content={post} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


function VideoPageClient() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const isPost = searchParams.get('type') === 'post';
    const { toast } = useToast();
    const db = useDatabase();

    const [content, setContent] = useState<Video | Post | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    
    const [contentToDelete, setContentToDelete] = useState<{id: string, type: 'video' | 'post'} | null>(null);
    const [commentToDelete, setCommentToDelete] = useState<{commentId: string, parentCommentId?: string} | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        if (!db || !params.id) return;

        const fetchContent = async () => {
            setLoading(true);

            const user = await db.getCurrentUser();
            setCurrentUser(user);

            let fetchedContent: Video | Post | null = null;
            if (isPost) {
                fetchedContent = await db.getPost(params.id);
            } else {
                fetchedContent = await db.getVideo(params.id);
                if (fetchedContent) {
                    const allVideos = await db.getAllVideos();
                    const recommendations = allVideos
                        .filter(v => v.id !== params.id && v.author)
                        .sort(() => 0.5 - Math.random()) 
                        .slice(0, 10);
                    setRecommendedVideos(recommendations);
                    
                    if(user) {
                       const result = await viewContentAction(fetchedContent.id, 'video', user.id);
                       if (result) {
                         await db.updateVideo(result.updatedContent as Video);
                         await db.updateUser(result.updatedUser);
                       }
                    }
                }
            }

            if (!fetchedContent) {
                toast({ title: "İçerik bulunamadı", variant: "destructive" });
                router.push('/home');
                return;
            }
            
            setContent(fetchedContent);
            
            if (user && fetchedContent.author) {
                setIsSubscribed((user.subscriptions || []).includes(fetchedContent.authorId));
                const userLikes = isPost ? user.likedPosts : user.likedVideos;
                setIsLiked((userLikes || []).includes(fetchedContent.id));
            }

            setLoading(false);
        };

        fetchContent();
    }, [params.id, isPost, router, toast, db]);

    // --- Event Handlers ---

    const handleSubscription = async () => {
        if (!currentUser || !content || !content.authorId || !db) return;
        if(currentUser.id === content.authorId) return;
        
        const originalSubscribed = isSubscribed;
        setIsSubscribed(!originalSubscribed);

        try {
          const { updatedCurrentUser, updatedChannelUser } = await subscribeAction(currentUser.id, content.authorId);
          await db.updateUser(updatedCurrentUser);
          await db.updateUser(updatedChannelUser);
          
          setContent(prev => prev ? { ...prev, author: updatedChannelUser } : null);
          setCurrentUser(updatedCurrentUser);
          
          toast({ title: !originalSubscribed ? "Abone Olundu!" : "Abonelikten Çıkıldı" });
        } catch (error) {
           setIsSubscribed(originalSubscribed); // Revert on failure
           toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
        }
    };
    
    const handleLike = async () => {
        if (!currentUser || !content || !db) {
            toast({ title: "Giriş Gerekli", variant: "destructive" });
            return;
        }

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setContent(prev => prev ? { ...prev, likes: prev.likes + (newIsLiked ? 1 : -1) } : prev);

        try {
            const { updatedContent, updatedUser } = await likeContentAction(content.id, currentUser.id, isPost ? 'post' : 'video');
            await db.updateUser(updatedUser);
             if (isPost) {
                await db.updatePost(updatedContent as Post);
             } else {
                await db.updateVideo(updatedContent as Video);
             }
            setCurrentUser(updatedUser);
        } catch (error) {
            setIsLiked(!newIsLiked);
            setContent(prev => prev ? { ...prev, likes: prev.likes - (newIsLiked ? 1 : -1) } : prev);
            toast({ title: "Hata", description: "Beğenme işlemi başarısız oldu.", variant: "destructive" });
        }
    };

    const handleAddComment = async (text: string) => {
        if (!currentUser || !content || !db) return false;
        try {
            const newComment = await addCommentToAction(content.id, isPost ? 'post' : 'video', currentUser.id, text);
            await db.addCommentToContent(content.id, newComment, isPost ? 'post' : 'video');
            setContent(prev => prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev);
            toast({ title: "Yorum Eklendi" });
            return true;
        } catch (error) {
            toast({ title: "Hata", description: "Yorum eklenemedi.", variant: "destructive" });
            return false;
        }
    };

    const handleAddReply = (parentCommentId: string, newReply: Comment) => {
        setContent(prev => {
            if (!prev) return null;
            const updatedComments = prev.comments.map(c => {
                if (c.id === parentCommentId) {
                    return { ...c, replies: [newReply, ...(c.replies || [])] };
                }
                return c;
            });
            return { ...prev, comments: updatedComments };
        });
    };
    
    const handleDeleteContent = async () => {
        if (!contentToDelete || !currentUser || contentToDelete.id !== content?.id || !db) return;
        
        try {
            await deleteContentAction(contentToDelete.id, contentToDelete.type, currentUser.id);
            if (contentToDelete.type === 'video') await db.deleteVideo(contentToDelete.id);
            else await db.deletePost(contentToDelete.id);

            toast({ title: "İçerik Silindi" });
            router.push(`/channel/${currentUser.username}`);
        } catch (error) {
            toast({ title: "Hata", description: "İçerik silinemedi.", variant: "destructive" });
        } finally {
            setContentToDelete(null);
        }
    };
    
     const handleDeleteComment = async () => {
        if (!commentToDelete || !content || !currentUser || !db) return;
        try {
            await deleteCommentAction(content.id, isPost ? 'post' : 'video', commentToDelete.commentId, currentUser.id, commentToDelete.parentCommentId);
            
            if (commentToDelete.parentCommentId) {
                 await db.deleteReplyFromComment(commentToDelete.parentCommentId, commentToDelete.commentId);
            } else {
                 await db.deleteCommentFromContent(content.id, commentToDelete.commentId, isPost ? 'post' : 'video');
            }
           
            setContent(prev => {
                if (!prev) return null;
                let updatedComments;
                if(commentToDelete.parentCommentId) { 
                    updatedComments = prev.comments.map(c => {
                       if (c.id === commentToDelete.parentCommentId) {
                           const filteredReplies = (c.replies || []).filter(r => r.id !== commentToDelete.commentId);
                           return {...c, replies: filteredReplies};
                       }
                       return c;
                    });
                } else {
                    updatedComments = prev.comments.filter(c => c.id !== commentToDelete.commentId);
                }
                return { ...prev, comments: updatedComments };
            });

            toast({ title: "Yorum Silindi" });
        } catch (error) {
            toast({ title: "Hata", description: "Yorum silinemedi.", variant: "destructive" });
        } finally {
            setCommentToDelete(null);
        }
    };


    if (loading || !db || !content) {
        return <div className="text-center py-20">İçerik yükleniyor...</div>;
    }

    const video = isPost ? null : content as Video;
    const post = isPost ? content as Post : null;
    const author = content.author;

    if (!author) {
        toast({ title: "İçerik sahibi bulunamadı", variant: "destructive" });
        router.push('/home');
        return null;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                {video && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mb-4">
                        <video src={video.videoUrl} controls autoPlay className="w-full h-full" />
                    </div>
                )}
                 {post && (
                    <div className="mb-4">
                        <PostContent 
                           post={post}
                           currentUser={currentUser}
                           onLike={handleLike}
                           onComment={() => {}} // Comments are below
                           isLiked={isLiked}
                           isSubscribed={isSubscribed}
                           onSubscribe={handleSubscription}
                           onDelete={() => setContentToDelete({id: post.id, type: 'post'})}
                        />
                    </div>
                )}

                {!isPost && video && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <Link href={`/channel/${author.username}`}>
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={author.profilePicture} alt={author.displayName || author.username} data-ai-hint="person face" />
                                        <AvatarFallback>{(author.displayName || author.username || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div>
                                    <Link href={`/channel/${author.username}`} className="font-semibold hover:underline">{author.displayName || author.username}</Link>
                                    <p className="text-sm text-muted-foreground">{author.subscribers.toLocaleString()} abone</p>
                                </div>
                                {currentUser?.id !== author.id && currentUser && (
                                     <Button onClick={handleSubscription} variant={isSubscribed ? 'secondary' : 'default'} className="rounded-full ml-4">
                                        {isSubscribed ? 'Abonelikten Çık' : 'Abone Ol'}
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                 {currentUser?.id === author.id && (
                                    <Button variant="ghost" className="rounded-full gap-2 text-destructive hover:text-destructive" onClick={() => setContentToDelete({id: video.id, type: 'video'})}>
                                        <Trash2 className="h-5 w-5" /> Sil
                                    </Button>
                                )}
                                <Button variant="ghost" className="rounded-full gap-2" onClick={handleLike}>
                                    <Heart className={isLiked ? "text-primary fill-primary" : ""} /> {(content.likes || 0).toLocaleString()}
                                </Button>
                                <ShareDialog content={content} />
                            </div>
                        </div>

                        <Card className="bg-secondary p-4 rounded-lg">
                            <p className="font-semibold">{formatViews(video.views)} &bull; {timeAgo(video.createdAt)}</p>
                            <p className="whitespace-pre-wrap">{video.description}</p>
                        </Card>
                    </>
                )}

                {/* Comments Section */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">{(content.comments?.length || 0)} Yorum</h2>
                    {currentUser && (
                         <div className="flex items-start gap-4 mb-6">
                            <Avatar>
                                <AvatarImage src={currentUser.profilePicture} alt={currentUser.displayName || currentUser.username} data-ai-hint="person face" />
                                <AvatarFallback>{(currentUser.displayName || currentUser.username || 'U').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CommentInput onSubmit={handleAddComment} />
                        </div>
                    )}
                    <div className="space-y-6">
                       {content.comments && content.comments.map(comment => (
                            <CommentDisplay 
                                key={comment.id}
                                comment={comment}
                                currentUser={currentUser!}
                                content={content}
                                onReply={handleAddReply}
                                onDelete={(commentId, parentCommentId) => setCommentToDelete({commentId, parentCommentId})}
                            />
                       ))}
                    </div>
                </div>
            </div>

            {/* Recommended Videos */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-xl font-bold">Sıradaki</h2>
                {recommendedVideos.map(recVideo => <VideoCard key={recVideo.id} video={recVideo} />)}
            </div>
            
             <AlertDialog open={!!contentToDelete} onOpenChange={(open) => !open && setContentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu eylem geri alınamaz. Bu içerik kalıcı olarak sunucularımızdan silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setContentToDelete(null)}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteContent} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yorumu silmek istediğinizden emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu eylem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCommentToDelete(null)}>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
