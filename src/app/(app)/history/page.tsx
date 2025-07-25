import { VideoCard } from "@/components/video-card";
import { mockVideos, mockUsers } from "@/lib/data";

export default function HistoryPage() {
    // TODO: Replace with actual current user data
    const currentMockUser = mockUsers[0];
    const viewedVideos = mockVideos.filter(video => currentMockUser.viewedVideos.includes(video.id));
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Watch History</h1>
            {viewedVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {viewedVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-20">
                    <p className="text-lg">Your watch history is empty.</p>
                </div>
            )}
        </div>
    );
}
