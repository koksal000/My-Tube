import { VideoCard } from "@/components/video-card";
import { mockVideos, mockUsers } from "@/lib/data";

export default function LikedPage() {
  // TODO: Replace with actual current user data
  const currentMockUser = mockUsers[0];
  const likedVideos = mockVideos.filter(video => currentMockUser.likedVideos.includes(video.id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Liked Videos</h1>
      {likedVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likedVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">You haven't liked any videos yet.</p>
          <p>Your liked videos will appear here.</p>
        </div>
      )}
    </div>
  );
}
