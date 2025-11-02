"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Video } from "@/lib/types"
import React from "react"
import { addVideoAction } from "@/app/actions"
import { useDatabase } from "@/lib/db-provider"
import { useAuth } from "@/firebase"
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function UploadVideoForm() {
  const router = useRouter()
  const { toast } = useToast();
  const db = useDatabase();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleVideoUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!db || !user) {
        toast({ title: "Hata", description: "Yükleme yapmak için giriş yapmalısınız.", variant: "destructive" });
        return;
    }
    setIsUploading(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const thumbnailFile = formData.get("thumbnail") as File;
    const videoFile = formData.get("video") as File;

    if (!title || !thumbnailFile || !videoFile || thumbnailFile.size === 0 || videoFile.size === 0) {
        toast({ title: "Eksik alanlar", description: "Lütfen tüm alanları doldurun ve dosyaları seçin.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    
    try {
      toast({ title: "Yükleme Başladı", description: "Dosyalarınız yükleniyor, bu işlem biraz zaman alabilir..." });
      
      const storage = getStorage();
      
      const uploadFileAsBase64 = async (file: File, folder: string): Promise<string> => {
        const base64Data = await fileToBase64(file);
        const fileRef = ref(storage, `${folder}/${user.uid}/${Date.now()}-${file.name}`);
        const snapshot = await uploadString(fileRef, base64Data, 'data_url');
        return await getDownloadURL(snapshot.ref);
      }

      const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFileAsBase64(thumbnailFile, 'thumbnails'),
        uploadFileAsBase64(videoFile, 'videos')
      ]);
      
      const newVideoData: Omit<Video, 'id' | 'author' | 'comments'> = {
          title,
          description,
          thumbnailUrl,
          videoUrl,
          duration: 0, // In a real app, you'd get this from the video file metadata
          authorId: user.uid,
          views: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
      };

      const newVideo = await addVideoAction(newVideoData);
      await db.addVideo(newVideo);

      toast({
          title: "Yükleme Başarılı!",
          description: "Videonuz yüklendi ve şimdi mevcut.",
      });
      router.push(`/video/${newVideo.id}`);

    } catch (error) {
      console.error("Upload failed", error);
      toast({ title: "Yükleme Başarısız", description: `Yükleme sırasında bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, variant: "destructive" });
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
      <Button type="submit" className="w-full" disabled={isUploading || !db || !user}>
        {isUploading ? 'Yükleniyor...' : 'Video Yükle'}
      </Button>
    </form>
  )
}
