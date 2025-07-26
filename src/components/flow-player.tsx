"use client"

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/types";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThumbsUp, MessageCircle } from "lucide-react";

export default function FlowPlayer({ video }: { video: Video }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { ref, inView } = useInView({
        threshold: 0.9, // %90'ı göründüğünde tetikle
    });

    useEffect(() => {
        if (inView) {
            videoRef.current?.play();
            setIsPlaying(true);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [inView]);

    const handleVideoClick = () => {
        if (isPlaying) {
            videoRef.current?.pause();
            setIsPlaying(false);
        } else {
            videoRef.current?.play();
            setIsPlaying(true);
        }
    };

    return (
        <div ref={ref} className="relative w-full h-full">
            <video
                ref={videoRef}
                src={video.videoUrl}
                loop
                muted
                onClick={handleVideoClick}
                className="w-full h-full object-contain"
                playsInline
            />
            <div className="absolute bottom-4 left-4 text-white drop-shadow-lg">
                <Link href={`/channel/${video.author.username}`} className="flex items-center gap-2 mb-2">
                    <Avatar>
                        <AvatarImage src={video.author.profilePicture} alt={video.author.displayName} data-ai-hint="person face" />
                        <AvatarFallback>{video.author.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">@{video.author.username}</span>
                </Link>
                <h3 className="font-semibold text-lg line-clamp-1">{video.title}</h3>
                <p className="text-sm line-clamp-2">{video.description}</p>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col items-center gap-4 text-white">
                <button className="flex flex-col items-center gap-1">
                    <ThumbsUp size={28} />
                    <span className="text-sm font-semibold">{video.likes.toLocaleString()}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <MessageCircle size={28} />
                    <span className="text-sm font-semibold">{video.comments.length}</span>
                </button>
            </div>
        </div>
    );
}
