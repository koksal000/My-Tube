"use client"

import { getVideoByAuthor, getPostsByAuthor, updateUser, getCurrentUser, getUserByUsername } from "@/lib/data";
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
import { MessageSquare } from "lucide-react";

export default function ChannelPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channelUser, setChannelUser] = useState<User | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      if(!params.username) return;

      const foundChannelUser = getUserByUsername(params.username as string);
      const loggedInUser = getCurrentUser();
      
      if (!loggedInUser) {
        router.push('/login');
        return;
      }
      setCurrentUser(loggedInUser);

      if (foundChannelUser) {
        setChannelUser(foundChannelUser);
         const videos = getVideoByAuthor(foundChannelUser.id);
         const posts = getPostsByAuthor(foundChannelUser.id);
         setUserVideos(videos);
         setUserPosts(posts);

         if (loggedInUser.id === foundChannelUser.id) {
           setIsOwnProfile(true);
         } else {
           setIsSubscribed(loggedInUser.subscriptions.includes(foundChannelUser.id));
         }

      } else {
         toast({ title: "Kanal Bulunamadı", description: "Bu kullanıcı adına sahip bir kanal yok.", variant: "destructive" });
         router.push('/home');
      }
    }
    init();
    
  }, [params.username, router, toast]);

  const handleProfileUpdate = (updatedUser: User) => {
    setChannelUser(updatedUser);
    setCurrentUser(updatedUser); // Update currentUser in state as well
    if (updatedUser.username !== params.username) {
      router.push(`/channel/${updatedUser.username}`);
    }
  }

  const handleSubscription = async () => {
    if (!currentUser || !channelUser || isOwnProfile) return;

    let updatedSubscriptions = [...currentUser.subscriptions];
    let updatedSubscribers = channelUser.subscribers;

    if (isSubscribed) {
      // Unsubscribe
      updatedSubscriptions = updatedSubscriptions.filter(id => id !== channelUser.id);
      updatedSubscribers--;
    } else {
      // Subscribe
      updatedSubscriptions.push(channelUser.id);
      updatedSubscribers++;
    }

    const updatedCurrentUser: User = { ...currentUser, subscriptions: updatedSubscriptions };
    const updatedChannelUser: User = { ...channelUser, subscribers: updatedSubscribers };

    try {
      updateUser(updatedCurrentUser);
      updateUser(updatedChannelUser);
      
      setCurrentUser(updatedCurrentUser);
      setChannelUser(updatedChannelUser);
      setIsSubscribed(!isSubscribed);
      
       toast({
        title: isSubscribed ? "Abonelikten Çıkıldı" : "Abone Olundu!",
        description: isSubscribed ? `${channelUser.displayName} kanalından aboneliğinizi kaldırdınız.` : `${channelUser.displayName} kanalına başarıyla abone oldunuz.`,
      });

      // Force header/sidebar refresh by navigating, even to the same page
      router.refresh();

    } catch (error) {
       toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    }
  };


  if (!channelUser) {
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
            <div className={`flex items-end gap-4 px-8 ${channelUser.banner ? '-mt-16' : 'mt-8'}`}>
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={channelUser.profilePicture} alt={channelUser.displayName} data-ai-hint="person face" />
                    <AvatarFallback className="text-4xl">{channelUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="pb-4 flex-grow">
                    <h1 className="text-3xl font-bold">{channelUser.displayName}</h1>
                    <p className="text-muted-foreground">@{channelUser.username} &bull; {channelUser.subscribers.toLocaleString()} abone</p>
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
                           <VideoCard key={video.id} video={video} />
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
                            <Card key={post.id}>
                                <CardContent className="p-4">
                                    {post.imageUrl && <Image src={post.imageUrl} alt={post.caption} width={400} height={300} className="w-full h-auto rounded-md mb-2" data-ai-hint="user post" />}
                                    <p>{post.caption}</p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground py-10">Bu kanal henüz gönderi oluşturmadı.</div>
                    )}
                </div>
            </TabsContent>
             <TabsContent value="about">
                <Card>
                    <CardContent className="p-6">
                        <p className="whitespace-pre-wrap">{channelUser.about || `${channelUser.displayName} kanalına hoş geldiniz!`}</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
