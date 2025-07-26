"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { User, Video } from "@/lib/types"
import React from "react"
import { addVideo, getCurrentUser } from "@/lib/db"

// Helper function to read file as base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export function UploadVideoForm() {
  const router = useRouter()
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleVideoUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsUploading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const thumbnailFile = formData.get("thumbnail") as File;
    const videoFile = formData.get("video") as File;
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        toast({ title: "Hata", description: "Yükleme yapmak için giriş yapmalısınız.", variant: "destructive" });
        setIsUploading(false);
        return;
    }

    if (!title || !thumbnailFile || !videoFile || thumbnailFile.size === 0 || videoFile.size === 0) {
        toast({ title: "Eksik alanlar", description: "Lütfen tüm alanları doldurun ve dosyaları seçin.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    
    try {
      const [thumbnailUrl, videoUrl] = await Promise.all([
        toBase64(thumbnailFile),
        toBase64(videoFile)
      ]);
      
      const newVideo: Omit<Video, 'author'> = {
          id: `video${Date.now()}`,
          title,
          description,
          thumbnailUrl,
          videoUrl,
          duration: 0, // In a real app, you'd get this from the video file metadata
          authorId: currentUser.id,
          views: 0,
          likes: 0,
          dislikes: 0,
          createdAt: new Date().toISOString(),
          comments: [],
      };

      await addVideo(newVideo);

      toast({
          title: "Yükleme Başarılı!",
          description: "Videonuz yüklendi ve şimdi mevcut.",
      });
      router.push(`/video/${newVideo.id}`);

    } catch (error) {
      console.error("Upload failed", error);
      toast({ title: "Yükleme Başarısız", description: "Yükleme sırasında bir hata oluştu. Dosya çok büyük olabilir.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleVideoUpload} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" name="title" placeholder="Harika videom" required disabled={isUploading} />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" placeholder="Videonuzun kısa bir açıklaması." required disabled={isUploading} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="thumbnail">Küçük Resim</Label>
        <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" required disabled={isUploading} />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="video">Video</Label>
        <Input id="video" name="video" type="file" accept="video/*" required disabled={isUploading}/>
      </div>
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? 'Yükleniyor...' : 'Video Yükle'}
      </Button>
    </form>
  )
}
