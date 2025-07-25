"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { User, Post } from "@/lib/types"
import React from "react"

// Helper function to read file as base64 and compress image
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Image compression logic
    if (file.type.startsWith('image/')) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 720;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            // Get the data-URL with quality reduction for jpeg
            resolve(canvas.toDataURL(file.type, 0.8));
        }
        img.onerror = error => reject(error);
    } else {
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    }
});

export function UploadPostForm() {
  const router = useRouter()
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);


  const handlePostUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsUploading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const caption = formData.get("caption") as string;
    const imageFile = formData.get("image") as File;
    
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        toast({ title: "Error", description: "You must be logged in to post.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    const currentUser: User = JSON.parse(storedUser);

    if (!imageFile || imageFile.size === 0) {
        toast({ title: "Missing Image", description: "Please select an image file.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    
    try {
        const imageUrl = await toBase64(imageFile);

        const storedPosts = localStorage.getItem("myTubePosts");
        const allPosts: Omit<Post, 'author'>[] = storedPosts ? JSON.parse(storedPosts) : [];
        
        const newPost: Omit<Post, 'author'> = {
            id: `post${Date.now()}`,
            caption,
            imageUrl,
            authorId: currentUser.id,
            likes: 0,
            createdAt: new Date().toISOString(),
            comments: [],
        };

        const updatedPosts = [...allPosts, newPost];
        localStorage.setItem("myTubePosts", JSON.stringify(updatedPosts));

        toast({
            title: "Post Created!",
            description: "Your new post is now live.",
        });
        router.push(`/channel/${currentUser.username}`);

    } catch (error) {
        console.error("Upload failed", error);
        toast({ title: "Upload Failed", description: "Could not process the image file.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handlePostUpload} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" placeholder="What's on your mind?" disabled={isUploading} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image">Image</Label>
        <Input id="image" name="image" type="file" accept="image/*" required disabled={isUploading} />
      </div>
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  )
}
