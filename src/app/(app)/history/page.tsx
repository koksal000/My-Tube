"use client"

import { VideoCard } from "@/components/video-card";
import { useState, useEffect } from "react";
import type { Video } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/lib/db";

export default function HistoryPage() {
    const router = useRouter();
    const [viewedVideos, setViewedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useDatabase();
    
    useEffect(() => {
        if (!db) return;
        const fetchHistory = async () => {
            const currentUser = await db.getCurrentUser();
            if (currentUser) {
                if(currentUser.viewedVideos && currentUser.viewedVideos.length > 0) {
                   const userViewedVideos = await Promise.all(currentUser.viewedVideos.map(id => db.getVideo(id)));
                   setViewedVideos(userViewedVideos.filter((v): v is Video => !!v).reverse());
                } else {
                    setViewedVideos([]);
                }
            } else {
                router.push('/login');
            }
            setLoading(false);
        }
        fetchHistory();
    }, [router, db]);

    if(loading || !db) {
        return <div>Geçmiş yükleniyor...</div>
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">İzleme Geçmişi</h1>
            {viewedVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {viewedVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-20">
                    <p className="text-lg">İzleme geçmişiniz boş.</p>
                </div>
            )}
        </div>
    );
}
