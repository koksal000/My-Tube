"use client"

import { getVideoByAuthor, getPostsByAuthor } from "@/lib/db";
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
import { getCurrentUser, getUserByUsername } from "@/lib/db";

export default function ChannelPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [channelUser, setChannelUser] = useState<User | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      if(!params.username) return;

      const foundChannelUser = await getUserByUsername(params.username as string);
      
      if (foundChannelUser) {
        setChannelUser(foundChannelUser);
         const videos = await getVideoByAuthor(foundChannelUser.id);
         const posts = await getPostsByAuthor(foundChannelUser.id);
         setUserVideos(videos);
         setUserPosts(posts);
      } else {
         // Optional: handle user not found, e.g., redirect to a 404 page
      }
      
      const loggedInUser = await getCurrentUser();
      if(loggedInUser){
        setCurrentUser(loggedInUser);
        if(loggedInUser.username === params.username) {
          setIsOwnProfile(true);
        }
      }
    }
    init();
    
  }, [params.username, router]);

  const handleProfileUpdate = (updatedUser: User) => {
    setChannelUser(updatedUser);
    setCurrentUser(updatedUser); // also update the current user state if it's the same person
    if (updatedUser.username !== params.username) {
      router.push(`/channel/${updatedUser.username}`);
    }
  }


  if (!channelUser) {
    return <div className="text-center py-20">Loading Channel...</div>;
  }

  return (
    <div>
        <div className="mb-8">
            {channelUser.banner && (
              <div className="h-48 w-full rounded-lg bg-secondary">
                  <Image src={channelUser.banner} alt="Channel banner" width={1200} height={300} className="w-full h-full object-cover rounded-lg" data-ai-hint="channel banner abstract"/>
              </div>
            )}
            <div className={`flex items-end gap-4 px-8 ${channelUser.banner ? '-mt-16' : 'mt-8'}`}>
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={channelUser.profilePicture} alt={channelUser.displayName} data-ai-hint="person face" />
                    <AvatarFallback className="text-4xl">{channelUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="pb-4 flex-grow">
                    <h1 className="text-3xl font-bold">{channelUser.displayName}</h1>
                    <p className="text-muted-foreground">@{channelUser.username} &bull; {channelUser.subscribers.toLocaleString()} subscribers</p>
                </div>
                <div className="pb-4">
                  {isOwnProfile ? (
                     <EditProfileDialog user={channelUser} onProfileUpdate={handleProfileUpdate} />
                  ) : (
                    <Button size="lg" className="rounded-full">Subscribe</Button>
                  )}
                </div>
            </div>
        </div>

        <Tabs defaultValue="videos" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="videos">
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {userVideos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="posts">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {userPosts.map(post => (
                        <Card key={post.id}>
                            <CardContent className="p-4">
                                <p>{post.caption}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>
             <TabsContent value="about">
                <Card>
                    <CardContent className="p-6">
                        <p className="whitespace-pre-wrap">{channelUser.about || `Welcome to the official channel of ${channelUser.displayName}!`}</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
