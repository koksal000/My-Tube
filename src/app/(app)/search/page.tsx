"use client";

import { VideoCard } from "@/components/video-card";
import { getAllVideos } from "@/lib/db";
import { searchContent, SearchContentInput } from "@/ai/flows/contextual-search";
import { Suspense, useEffect, useState } from "react";
import type { Video } from "@/lib/types";
import { useSearchParams } from "next/navigation";

function SearchResults({ query, allVideos }: { query: string, allVideos: Video[] }) {
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
          setSearchResults(allVideos);
          setLoading(false);
          return;
      }

      setLoading(true);

      const allContent = allVideos.map(v => ({...v, contentType: 'video'}));
      
      const searchInput: SearchContentInput = {
        query: query,
        contentList: allContent.map(c => ({ id: c.id, title: c.title, description: c.description, username: c.author.username }))
      }

      try {
        const aiResults = await searchContent(searchInput);
        const resultIds = aiResults.map((r: any) => r.id);
        const results = allVideos.filter(v => resultIds.includes(v.id))
                                  .sort((a, b) => resultIds.indexOf(a.id) - resultIds.indexOf(b.id));
        setSearchResults(results);
      } catch(e) {
        console.error("AI search failed, falling back to simple filter", e);
        const lowerCaseQuery = query.toLowerCase();
        const results = allVideos.filter(
            (video) =>
            video.title.toLowerCase().includes(lowerCaseQuery) ||
            video.description.toLowerCase().includes(lowerCaseQuery) ||
            video.author.displayName.toLowerCase().includes(lowerCaseQuery)
        );
        setSearchResults(results);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query, allVideos]);

  if (loading) {
    return <div className="text-center py-20">Loading search results...</div>;
  }

  return (
    <>
      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {searchResults.map((video: Video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">No results found for &quot;{query}&quot;</p>
        </div>
      )}
    </>
  )
}

function SearchPageClient() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || "";
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllVideos = async () => {
            setLoading(true);
            const videos = await getAllVideos();
            setAllVideos(videos);
            setLoading(false);
        };
        fetchAllVideos();
    }, []);

    if (loading && !allVideos.length) {
        return <div className="text-center py-20">Loading...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Search results for &quot;{query}&quot;</h1>
            <SearchResults query={query} allVideos={allVideos} />
        </div>
    )
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading search...</div>}>
      <SearchPageClient />
    </Suspense>
  )
}
