"use client"

import { VideoCard } from "@/components/video-card";
import { mockVideos } from "@/lib/data";
import { useState, useEffect } from "react";
import type { User, Video } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const router = useRouter();
    const [viewedVideos, setViewedVideos] = useState<Video[]>([]);
    
    useEffect(() => {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            const currentUser: User = JSON.parse(storedUser);
            // Filter all videos to find those whose IDs are in the user's viewedVideos list
            const userViewedVideos = mockVideos.filter(video => currentUser.viewedVideos.includes(video.id));
            setViewedVideos(userViewedVideos);
        } else {
            router.push('/login');
        }
    }, [router]);

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
