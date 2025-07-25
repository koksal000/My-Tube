"use client"

import { mockVideos, mockPosts } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/video-card";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { User, Video, Post } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function ChannelPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    const storedUsers = localStorage.getItem("myTubeUsers");
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    const channelUser = allUsers.find(u => u.username === params.username);
    
    if (channelUser) {
      setUser(channelUser);
       // In a real app, you'd fetch user-specific content. Here we filter mock data.
       const videos = mockVideos.filter(v => v.author.username === channelUser.username);
       const posts = mockPosts.filter(p => p.author.username === channelUser.username);
       setUserVideos(videos);
       setUserPosts(posts);
    } else {
       // Optional: handle user not found, e.g., redirect to a 404 page
    }
  }, [params.username]);


  if (!user) {
    return <div className="text-center py-20">Loading Channel...</div>;
  }

  return (
    <div>
        <div className="mb-8">
            <div className="h-48 w-full rounded-lg bg-secondary">
                <Image src="https://placehold.co/1200x300.png" alt="Channel banner" width={1200} height={300} className="w-full h-full object-cover rounded-lg" data-ai-hint="abstract background"/>
            </div>
            <div className="flex items-end gap-4 px-8 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={user.profilePicture} alt={user.displayName} data-ai-hint="person face" />
                    <AvatarFallback className="text-4xl">{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="pb-4 flex-grow">
                    <h1 className="text-3xl font-bold">{user.displayName}</h1>
                    <p className="text-muted-foreground">@{user.username} &bull; {user.subscribers.toLocaleString()} subscribers</p>
                </div>
                <div className="pb-4">
                    <Button size="lg" className="rounded-full">Subscribe</Button>
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
                        <p>Welcome to the official channel of {user.displayName}! More info coming soon.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
