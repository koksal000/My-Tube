"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchContent, SearchContentInput } from "@/ai/flows/contextual-search";
import type { Video, User } from "@/lib/types";
import { VideoCard } from "@/components/video-card";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/lib/db";

function SearchResults({ query }: { query: string }) {
  const router = useRouter();
  const db = useDatabase();
  const [channels, setChannels] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const performSearch = async () => {
      setLoading(true);

      const allDBVideos = await db.getAllVideos();
      const allDBUsers = await db.getAllUsers();
      
      const allContentForAI = [
        ...allDBVideos.filter(v => v.author).map(v => ({ id: v.id, title: v.title, description: v.description, username: v.author!.username, type: 'video' })),
        ...allDBUsers.map(u => ({ id: u.id, title: u.displayName, description: u.about || '', username: u.username, type: 'channel' }))
      ];

      try {
        const searchInput: SearchContentInput = {
          query: query,
          contentList: allContentForAI.map(c => ({ id: c.id, title: c.title, description: c.description, username: c.username }))
        };

        const aiResults = await searchContent(searchInput);
        const resultIds = aiResults.map(r => r.id);
        
        const foundVideos = allDBVideos.filter(v => resultIds.includes(v.id))
                                       .sort((a, b) => resultIds.indexOf(a.id) - resultIds.indexOf(b.id));

        const foundChannels = allDBUsers.filter(u => resultIds.includes(u.id) && u.username !== 'admin')
                                        .sort((a, b) => resultIds.indexOf(a.id) - resultIds.indexOf(b.id));

        setVideos(foundVideos);
        setChannels(foundChannels);

      } catch (e) {
        console.error("AI search failed, falling back to simple filter", e);
        const lowerCaseQuery = query.toLowerCase();
        const filteredVideos = allDBVideos.filter(
            (video) =>
            video.author &&
            (video.title.toLowerCase().includes(lowerCaseQuery) ||
            video.description.toLowerCase().includes(lowerCaseQuery) ||
            (video.author.displayName && video.author.displayName.toLowerCase().includes(lowerCaseQuery)))
        );
         const filteredChannels = allDBUsers.filter(
            (user) => user.username !== 'admin' &&
            ((user.displayName && user.displayName.toLowerCase().includes(lowerCaseQuery)) ||
             (user.username && user.username.toLowerCase().includes(lowerCaseQuery)))
        );
        setVideos(filteredVideos);
        setChannels(filteredChannels);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      performSearch();
    } else {
      setLoading(false);
      setVideos([]);
      setChannels([]);
    }
  }, [query, db]);

  if (loading || !db) {
    return <div className="text-center py-20">Arama sonuçları yükleniyor...</div>;
  }
  
  if (channels.length === 0 && videos.length === 0) {
     return (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">&quot;{query}&quot; için sonuç bulunamadı</p>
        </div>
      );
  }

  return (
    <div className="space-y-8">
      {channels.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Kanallar</h2>
          <div className="space-y-4">
            {channels.map((channel) => (
              <Card key={channel.id} className="hover:bg-secondary transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={channel.profilePicture} alt={channel.displayName || channel.username} data-ai-hint="person face" />
                    <AvatarFallback>{(channel.displayName || channel.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg cursor-pointer" onClick={() => router.push(`/channel/${channel.username}`)}>{channel.displayName || channel.username}</h3>
                    <p className="text-sm text-muted-foreground">@{channel.username} &bull; {(channel.subscribers || 0).toLocaleString()} abone</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{channel.about}</p>
                  </div>
                   <Button onClick={() => router.push(`/messages?to=${channel.username}`)}>Mesaj Gönder</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
           <h2 className="text-xl font-bold mb-4">Videolar</h2>
           <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video: Video) => (
                <VideoCard key={video.id} video={video} />
            ))}
            </div>
        </div>
      )}
    </div>
  )
}

function SearchPageClient() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || "";

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">{query ? `"${query}" için arama sonuçları` : "Arama"}</h1>
            <SearchResults query={query} />
        </div>
    )
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Arama yükleniyor...</div>}>
      <SearchPageClient />
    </Suspense>
  )
}
