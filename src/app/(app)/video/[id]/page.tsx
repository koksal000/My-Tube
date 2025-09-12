

"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, BellPlus, Film, Heart, MessageSquare, Trash2 } from "lucide-react";
import { VideoCard } from "@/components/video-card";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { User, Video, Comment, Post } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { addCommentToAction, addReplyToAction, likeContentAction, subscribeAction, getVideosAction, getVideoAction, getPostAction, viewContentAction, deleteContentAction, deleteCommentAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/data";
import { CommentInput } from "@/components/comment-input";
import { ShareDialog } from "@/components/share-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function timeAgo(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika önce";
    return "az önce";
}

function formatViews(views: number) {
    if(isNaN(views)) return "0 izlenme";
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)} Milyar izlenme`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M izlenme`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}B izlenme`;
    return `${views} izlenme`;
}

const CommentDisplay = ({ comment, currentUser, content, onReply, onDelete }: { comment: Comment, currentUser: User, content: Video | Post, onReply: (parentCommentId: string, reply: Comment) => void, onDelete: (commentId: string, parentCommentId?: string) => void, parentCommentId?: string }) => {
    const [showGifs, setShowGifs] = useState(true);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const { toast } = useToast();
    
     useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSetting = localStorage.getItem('myTube-showGifs');
            setShowGifs(savedSetting ? JSON.parse(savedSetting) : true);
        }
    }, []);

    if (!comment || !comment.author) {
        return <div className="flex gap-3">Yorum Yükleniyor...</div>;
    }

    const handleAddReply = async (text: string) => {
        const contentTypeForAction = 'videoUrl' in content ? 'video' : 'post';
        try {
            const newReply = await addReplyToAction(content.id, contentTypeForAction, comment.id, currentUser.id, text);
            onReply(comment.id, newReply);
            setShowReplyInput(false);
            toast({ title: "Yanıt Eklendi" });
            return true;
        } catch (error) {
            toast({ title: "Hata", description: "Yanıt eklenemedi.", variant: "destructive" });
            return false;
        }
    };
    
    const canDelete = currentUser.id === comment.author.id || currentUser.id === content.author.id;
    const isGif = comment.text.startsWith('http') && (comment.text.endsWith('.gif') || comment.text.endsWith('.webp') || comment.text.endsWith('.png') || comment.text.endsWith('.jpg'));

    return (
        <div className="flex gap-3">
            <Avatar>
                 <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName || comment.author.username} data-ai-hint="person face" />
                <AvatarFallback>{(comment.author.displayName || comment.a