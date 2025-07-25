import { VideoCard } from "@/components/video-card";
import { mockVideos, mockUsers } from "@/lib/data";
import { generateVideoRecommendations, VideoRecommendationsInput } from "@/ai/flows/video-recommendations";

// This is a server component, so we can fetch data here
export default async function HomePage() {
  
  // Create input for the AI flow
  const allVideosForAI = mockVideos.map(v => ({
    id: v.id,
    title: v.title,
    description: v.description,
    username: v.author.username,
    views: v.views,
    likes: v.likes,
    dislikes: v.dislikes,
    commentCount: v.comments.length
  }));

  // TODO: Replace with actual current user data
  const currentMockUser = mockUsers[0];

  const recommendationInput: VideoRecommendationsInput = {
    userProfile: {
      username: currentMockUser.username,
      likedVideos: currentMockUser.likedVideos,
      viewedVideos: currentMockUser.viewedVideos,
      subscribedChannels: currentMockUser.subscriptions.map(id => mockUsers.find(u => u.id === id)?.username || ''),
    },
    allVideos: allVideosForAI,
    boostByViews: 1.2,
    boostByLikes: 1.5,
  };

  let recommendedVideos = mockVideos;
  try {
    const recommendations = await generateVideoRecommendations(recommendationInput);
    const recommendedVideoIds = recommendations.map(rec => rec.id);
    recommendedVideos = mockVideos.filter(v => recommendedVideoIds.includes(v.id))
                                  .sort((a, b) => recommendedVideoIds.indexOf(a.id) - recommendedVideoIds.indexOf(b.id));

  } catch(e) {
    console.error("AI recommendation failed, falling back to mock data", e)
    // Fallback to all videos if AI fails
    recommendedVideos = mockVideos;
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recommendedVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
