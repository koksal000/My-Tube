import { VideoCard } from "@/components/video-card";
import { mockVideos, mockUsers, currentMockUser } from "@/lib/data";

export default function SubscriptionsPage() {
  const subscribedChannelsUsernames = currentMockUser.subscriptions
    .map(id => mockUsers.find(u => u.id === id)?.username)
    .filter((username): username is string => !!username);
  
  const subscriptionVideos = mockVideos.filter(video => 
    subscribedChannelsUsernames.includes(video.author.username)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>
      {subscriptionVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subscriptionVideos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg">You haven't subscribed to any channels yet.</p>
          <p>Videos from channels you subscribe to will appear here.</p>
        </div>
      )}
    </div>
  );
}
