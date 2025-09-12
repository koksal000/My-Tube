"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/lib/types"
import React from "react"
import { getCurrentUser } from "@/lib/data"
import { uploadFileAction, addPostAction } from "@/app/actions"


export function UploadPostForm() {
  const router = useRouter()
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);


  const handlePostUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsUploading(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
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
        const uploadFormData = new FormData();
        uploadFormData.append('fileToUpload', imageFile);
        const imageUrl = await uploadFileAction(uploadFormData);
        
        const newPostData: Omit<Post, 'id' | 'author' | 'comments'> = {
            caption,
            imageUrl,
            authorId: currentUser.id,
            likes: 0,
            createdAt: new Date().toISOString(),
        };

        const newPost = await addPostAction(newPostData as any);

        toast({
            title: "Gönderi Oluşturuldu!",
            description: "Yeni gönderiniz şimdi yayında.",
        });
        router.push(`/channel/${currentUser.username}`);

    } catch (error) {
        console.error("Upload failed", error);
        toast({ title: "Yükleme Başarısız", description: `Resim dosyası işlenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`, variant: "destructive" });
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
