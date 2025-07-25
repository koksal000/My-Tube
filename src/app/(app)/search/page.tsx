import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/data";
import { searchContent, SearchContentInput } from "@/ai/flows/contextual-search";
import { Suspense } from "react";
import type { Video } from "@/lib/types";

async function SearchResults({ query }: { query: string }) {
  const allContent = mockVideos.map(v => ({...v, contentType: 'video'}));
  
  const searchInput: SearchContentInput = {
    query: query,
    contentList: allContent.map(c => ({ id: c.id, title: c.title, description: c.description, username: c.author.username }))
  }

  let searchResults: Video[] = [];

  try {
    const aiResults = await searchContent(searchInput);
    const resultIds = aiResults.map((r: any) => r.id);
    searchResults = mockVideos.filter(v => resultIds.includes(v.id))
                              .sort((a, b) => resultIds.indexOf(a.id) - resultIds.indexOf(b.id));

  } catch(e) {
    console.error("AI search failed, falling back to simple filter", e);
    const lowerCaseQuery = query.toLowerCase();
    searchResults = mockVideos.filter(
        (video) =>
        video.title.toLowerCase().includes(lowerCaseQuery) ||
        video.description.toLowerCase().includes(lowerCaseQuery) ||
        video.author.displayName.toLowerCase().includes(lowerCaseQuery)
    );
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

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || "";
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search results for &quot;{query}&quot;</h1>
      <Suspense fallback={<div className="text-center py-20">Loading search results...</div>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  )
}
