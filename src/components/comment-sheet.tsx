"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Video, Post, Comment, User } from "@/lib/types";
import { Film } from "lucide-react";
import React, { useEffect, useState } from "react";
import { addCommentToAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { CommentInput } from "./comment-input";

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

const CommentDisplay = ({ comment }: { comment: Comment }) => {
    const [showGifs, setShowGifs] = useState(true);
     useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSetting = localStorage.getItem('myTube-showGifs');
            setShowGifs(savedSetting ? JSON.parse(savedSetting) : true);
        }
    }, []);

    if (!comment || !comment.author) {
        return <div className="flex gap-3">Yorum Yükleniyor...</div>;
    }

    const isGif = comment.text.startsWith('http') && (comment.text.endsWith('.gif') || comment.text.endsWith('.webp'));

    return (
        <div className="flex gap-3">
            <Avatar>
                 <AvatarImage src={comment.author.profilePicture} alt={comment.author.displayName || comment.author.username} data-ai-hint="person face" />
                <AvatarFallback>{(comment.author.displayName || comment.author.username || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">@{comment.author.username}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</p>
                </div>
                {isGif ? (
                    showGifs ? (
                        <img src={comment.text} alt="Yorum GIF'i" className="mt-2 rounded-lg max-w-xs" />
                    ) : (
                        <div className="mt-2 p-2 border rounded-md bg-secondary text-muted-foreground text-sm flex items-center gap-2">
                           <Film className="h-4 w-4" /> GIF
                        </div>
                    )
                ) : (
                    <p>{comment.text}</p>
                )}
            </div>
        </div>
    )
}


interface CommentSheetProps {
    content: Video | Post;
    currentUser: User;
    isOpen: boolean;
    onClose: () => void;
    onCommentAdded: (comment: Comment) => void;
}

export function CommentSheet({ content, currentUser, isOpen, onClose, onCommentAdded }: CommentSheetProps) {
    const { toast } = useToast();
    const isVideo = 'videoUrl' in content;

    const handleAddComment = async (text: string): Promise<boolean> => {
        if (!text.trim()) return false;

        try {
            const contentTypeForAction = isVideo ? 'video' : 'post';
            const newComment = await addCommentToAction(content.id, contentTypeForAction, currentUser.id, text);
            onCommentAdded(newComment);
            toast({ title: "Yorum Eklendi", description: "Yorumunuz başarıyla gönderildi." });
            return true; // Indicate success to clear the input
        } catch (error) {
            toast({ title: "Hata", description: "Yorum eklenirken bir sorun oluştu.", variant: "destructive" });
            return false;
        }
    };


    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[75vh] flex flex-col">
                <SheetHeader className="text-center">
                    <SheetTitle>{(content.comments?.length || 0)} Yorum</SheetTitle>
                </SheetHeader>
                <Separator />
                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {content.comments && content.comments.length > 0 ? (
                        content.comments.map(comment => (
                            <CommentDisplay key={comment.id} comment={comment} />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground pt-10">
                            <p>Henüz yorum yok.</p>
                            <p className="text-sm">İlk yorumu yapan siz olun!</p>
                        </div>
                    )}
                </div>
                 <Separator />
                 <div className="p-4 bg-background">
                    <div className="flex gap-4">
                        <Avatar>
                            <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.displayName || currentUser?.username} data-ai-hint="person face" />
                            <AvatarFallback>{(currentUser?.displayName || currentUser?.username || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CommentInput onSubmit={handleAddComment} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
