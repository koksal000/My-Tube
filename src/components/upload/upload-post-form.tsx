"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { User, Post } from "@/lib/types"
import React from "react"
import { addPost, getCurrentUser } from "@/lib/data"

// Helper function to read file as base64 and compress image
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 720;
            let { width, height } = img;

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
            if (!ctx) {
                return reject(new Error('Failed to get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Get the data-URL with quality reduction for jpeg
            resolve(canvas.toDataURL(file.type, 0.8));
        };
        img.onerror = reject;
    };
    reader.readAsDataURL(file);
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
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        toast({ title: "Hata", description: "Gönderi oluşturmak için giriş yapmalısınız.", variant: "destructive" });
        setIsUploading(false);
        return;
    }

    if (!imageFile || imageFile.size === 0) {
        toast({ title: "Eksik Resim", description: "Lütfen bir resim dosyası seçin.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    
    try {
        const imageUrl = await toBase64(imageFile);
        
        const newPost: Omit<Post, 'author' | 'comments'> = {
            id: `post-${Date.now()}`,
            caption,
            imageUrl,
            authorId: currentUser.id,
            likes: 0,
            createdAt: new Date().toISOString(),
        };

        await addPost(newPost);

        toast({
            title: "Gönderi Oluşturuldu!",
            description: "Yeni gönderiniz şimdi yayında.",
        });
        router.push(`/channel/${currentUser.username}`);

    } catch (error) {
        console.error("Upload failed", error);
        toast({ title: "Yükleme Başarısız", description: "Resim dosyası işlenemedi.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handlePostUpload} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="caption">Açıklama</Label>
        <Textarea id="caption" name="caption" placeholder="Aklınızda ne var?" disabled={isUploading} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image">Resim</Label>
        <Input id="image" name="image" type="file" accept="image/*" required disabled={isUploading} />
      </div>
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? 'Gönderiliyor...' : 'Gönderi Oluştur'}
      </Button>
    </form>
  )
}
