"use client"

import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentInputProps {
    onSubmit: (text: string) => Promise<boolean>;
    className?: string;
}

// Helper function to extract text and image URLs from HTML content
const processContentEditable = (element: HTMLDivElement): string => {
    // Check for images (GIFs/stickers from keyboard)
    const images = element.getElementsByTagName('img');
    if (images.length > 0 && images[0].src) {
        // If there's an image, return its source URL
        return images[0].src;
    }

    // Otherwise, return the plain text content
    return element.innerText;
};


export function CommentInput({ onSubmit, className }: CommentInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!editorRef.current || isSending) return;
        
        const content = processContentEditable(editorRef.current);
        if (!content.trim()) return;

        setIsSending(true);
        const success = await onSubmit(content);
        setIsSending(false);

        if (success && editorRef.current) {
            // Clear the input on successful submission
            editorRef.current.innerHTML = '';
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={cn("flex-grow space-y-2", className)}>
            <div className="relative">
                 <div
                    ref={editorRef}
                    contentEditable={!isSending}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    role="textbox"
                    aria-multiline="true"
                    className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&:empty:before]:content-['Yorum_ekle...'] [&:empty:before]:text-muted-foreground"
                />
                <div className="absolute top-1/2 right-1 -translate-y-1/2 flex items-center">
                    <Button variant="ghost" size="icon" onClick={handleSend} disabled={isSending}>
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
