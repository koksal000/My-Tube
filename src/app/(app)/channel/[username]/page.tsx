"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/video-card";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { User, Video, Post } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { EditProfileDialog } from "@/components/profile-edit-dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { subscribeAction, deleteContentAction } from "@/app/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDatabase } from "@/lib/db-provider";


export default function ChannelPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const { toast } = useToast();
  const db = useDatabase();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channelUser, setChannelUser] = useState<User | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<{id: string, type: 'video' | 'post'} | null>(null);
  
  useEffect(() => {
    if (!db) return;

    const init = async () => {
      if(!params.username) return;

      const loggedInUser = await db.getCurrentUser();
      if (!loggedInUser) {
        router.push('/login');
        return;
      }
      setCurrentUser(loggedInUser);
      
      const foundChannelUser = await db.getUserByUsername(params.username);

      if (foundChannelUser) {
        setChannelUser(foundChannelUser);
         const videos = await db.getVideosByAuthor(foundChannelUser.id);
         const posts = await db.getPostsByAuthor(foundChannelUser.id);
         setUserVideos(videos);
         setUserPosts(posts);

         if (loggedInUser.id === foundChannelUser.id) {
           setIsOwnProfile(true);
         } else {
           setIsSubscribed((loggedInUser.subscriptions || []).includes(foundChannelUser.id));
         }

      } else {
         toast({ title: "Kanal Bulunamadı", description: "Bu kullanıcı adına sahip bir kanal yok.", variant: "destructive" });
         router.push('/home');
      }
    }
    init();
    
  }, [params.username, router, toast, db]);

  const handleProfileUpdate = async (updatedUser: User) => {
    if (!db) return;
    await db.updateUser(updatedUser); // Update DB
    setChannelUser(updatedUser);
    setCurrentUser(updatedUser); 
    if (updatedUser.username !== params.username) {
      router.push(`/channel/${updatedUser.username}`);
    }
  }

  const handleSubscription = async () => {
    if (!currentUser || !channelUser || isOwnProfile || !db) return;

    const originalSubscribed = isSubscribed;
    const optimisticSubscribers = channelUser.subscribers + (originalSubscribed ? -1 : 1);

    setIsSubscribed(!originalSubscribed);
    setChannelUser({...channelUser, subscribers: optimisticSubscribers });

    try {
      const { updatedCurrentUser, updatedChannelUser } = await subscribeAction(currentUser.id, channelUser.id);
      
      await Promise.all([
        db.updateUser(updatedCurrentUser),
        db.updateUser(updatedChannelUser)
      ]);

      setCurrentUser(updatedCurrentUser);
      setChannelUser(updatedChannelUser);
      
      toast({
        title: !originalSubscribed ? "Abone Olundu!" : "Abonelikten Çıkıldı",
      });

    } catch (error) {
       setIsSubscribed(originalSubscribed);
       setChannelUser({...channelUser, subscribers: channelUser.subscribers }); // Revert
       toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    }
  };
  
   const handleDeleteConfirm = async () => {
    if (!contentToDelete || !currentUser || !db) return;
    try {
      await deleteContentAction(contentToDelete.id, contentToDelete.type, currentUser.id);
      
      if (contentToDelete.type === 'video') {
        await db.deleteVideo(contentToDelete.id);
        setUserVideos(prev => prev.filter(v => v.id !== contentToDelete.id));
      } else {
        await db.deletePost(contentToDelete.id);
        setUserPosts(prev => prev.filter(p => p.id !== contentToDelete.id));
      }
      toast({ title: "İçerik Silindi" });
    } catch (error) {
      toast({ title: "Hata", description: "İçerik silinirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setContentToDelete(null);
    }
  };


  if (!channelUser || !db) {
    return <div className="text-center py-20">Kanal Yükleniyor...</div>;
  }

  return (
    <div>
        <div className="mb-8">
            {channelUser.banner && (
              <div className="relative h-48 w-full rounded-lg bg-secondary">
                  <Image src={channelUser.banner} alt="Kanal banner'ı" layout="fill" className="w-full h-full object-cover rounded-lg" data-ai-hint="channel banner abstract"/>
              </div>
            )}
            <div className={`relative z-10 flex items-end gap-4 px-8 ${channelUser.banner ? '-mt-16' : 'mt-8'}`}>
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={channelUser.profilePicture} alt={channelUser.displayName || channelUser.username} data-ai-hint="person face" />
                    <AvatarFallback className="text-4xl">{(channelUser.displayName || channelUser.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="pb-4 flex-grow">
                    <h1 className="text-3xl font-bold">{channelUser.displayName || channelUser.username}</h1>
                    <p className="text-muted-foreground">@{channelUser.username} &bull; {(channelUser.subscribers || 0).toLocaleString()} abone</p>
                </div>
                <div className="pb-4 flex items-center gap-2">
                  {isOwnProfile ? (
                     <EditProfileDialog user={channelUser} onProfileUpdate={handleProfileUpdate} />
                  ) : (
                    <>
                      <Button size="lg" className="rounded-full" onClick={handleSubscription} variant={isSubscribed ? 'secondary' : 'default'}>
                        {isSubscribed ? 'Abonelikten Çık' : 'Abone Ol'}
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-full" onClick={() => router.push(`/messages?to=${channelUser.username}`)}>
                        <MessageSquare className="h-5 w-5 mr-2" /> Mesaj Gönder
                      </Button>
                    </>
                  )}
                </div>
            </div>
        </div>

        <Tabs defaultValue="videos" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="videos">Videolar</TabsTrigger>
                <TabsTrigger value="posts">Gönderiler</TabsTrigger>
                <TabsTrigger value="about">Hakkında</TabsTrigger>
            </TabsList>
            <TabsContent value="videos">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {userVideos.length > 0 ? (
                       userVideos.map(video => (
                          <div key={video.id} className="relative">
                            <VideoCard video={video} />
                            {isOwnProfile && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70">
                                            <MoreVertical className="h-4 w-4 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setContentToDelete({ id: video.id, type: 'video' })} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Sil</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                          </div>
                       ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground py-10">Bu kanal henüz video yüklemedi.</div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="posts">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {userPosts.length > 0 ? (
                        userPosts.map(post => (
                            <div key={post.id} className="relative group">
                              <Link href={`/video/${post.id}?type=post`}>
                                <Card className="overflow-hidden h-full">
                                    <CardContent className="p-0">
                                        {post.imageUrl && <Image src={post.imageUrl} alt={post.caption} width={400} height={300} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="user post" />}
                                        <div className="p-4">
                                          <p className="line-clamp-2">{post.caption}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                              </Link>
                              {isOwnProfile && (
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <MoreVertical className="h-4 w-4 text-white" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => setContentToDelete({ id: post.id, type: 'post' })} className="text-destructive focus:text-destructive">
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Sil</span>
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground py-10">Bu kanal henüz gönderi oluşturmadı.</div>
                    )}
                </div>
            </TabsContent>
             <TabsContent value="about">
                <Card>
                    <CardContent className="p-6">
                        <p className="whitespace-pre-wrap">{channelUser.about || `${channelUser.displayName || channelUser.username} kanalına hoş geldiniz!`}</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
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
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
