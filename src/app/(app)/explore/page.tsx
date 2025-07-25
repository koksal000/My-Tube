import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/data";

export default function ExplorePage() {
  // In a real app, this would fetch a list of trending/random videos.
  const exploreVideos = [...mockVideos].sort(() => 0.5 - Math.random());
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Explore</h1>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exploreVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
