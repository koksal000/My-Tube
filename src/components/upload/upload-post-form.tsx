"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/lib/types"
import React from "react"
import { addPostAction } from "@/app/actions"
import { useDatabase } from "@/lib/db-provider"
import { useAuth } from "@/firebase"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function UploadPostForm() {
  const router = useRouter()
  const { toast } = useToast();
  const db = useDatabase();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = React.useState(false);


  const handlePostUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!db || !user) {
        toast({ title: "Hata", description: "Gönderi oluşturmak için giriş yapmalısınız.", variant: "destructive" });
        return;
    }
    setIsUploading(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const caption = formData.get("caption") as string;
    const imageFile = formData.get("image") as File;

    if (!imageFile || imageFile.size === 0) {
        toast({ title: "Eksik Resim", description: "Lütfen bir resim dosyası seçin.", variant: "destructive" });
        setIsUploading(false);
        return;
    }
    
    try {
        const storage = getStorage();
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);
        
        const newPostData: Omit<Post, 'id' | 'author' | 'comments'> = {
            caption,
            imageUrl,
            authorId: user.uid,
            likes: 0,
            createdAt: new Date().toISOString(),
        };

        const newPost = await addPostAction(newPostData);
        await db.addPost(newPost);

        toast({
            title: "Gönderi Oluşturuldu!",
            description: "Yeni gönderiniz şimdi yayında.",
        });
        const dbUser = await db.getUser(user.uid);
        if (dbUser) {
            router.push(`/channel/${dbUser.username}`);
        } else {
            router.push('/home');
        }

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
      <Button type="submit" className="w-full" disabled={isUploading || !db || !user}>
        {isUploading ? 'Gönderiliyor...' : 'Gönderi Oluştur'}
      </Button>
    </form>
  )
}
