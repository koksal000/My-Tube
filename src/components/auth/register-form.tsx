"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"
import React from "react"
import { Textarea } from "../ui/textarea"
import { addUserAction } from "@/app/actions"
import { useDatabase } from "@/lib/db-provider"
import { useAuth } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MyTubeLogo = () => (
    <div className="flex items-center justify-center space-x-2 text-primary font-bold text-2xl mb-4">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span>My-Tube Reborn</span>
    </div>
)


export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast();
  const db = useDatabase();
  const { auth } = useAuth();
  const [addBanner, setAddBanner] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!db || !auth) {
        toast({ title: "Sistem hazır değil, lütfen bekleyin.", variant: "destructive" });
        return;
    }
    setIsRegistering(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const about = formData.get("about") as string;
    const profilePictureFile = formData.get("profile-picture") as File | null;
    const bannerFile = formData.get("banner") as File | null;
    
    const existingUser = await db.getUserByUsername(username);

    if (existingUser) {
      toast({
        title: "Kayıt Başarısız",
        description: "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.",
        variant: "destructive",
      });
      setIsRegistering(false);
      return;
    }
    
    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // 2. Upload files to Firebase Storage
        const storage = getStorage();
        const uploadFile = async (file: File, folder: string): Promise<string> => {
            const fileRef = ref(storage, `${folder}/${firebaseUser.uid}/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            return getDownloadURL(snapshot.ref);
        }
        
        let profilePictureUrl = "/uploads/default-avatar.png"; 
        if (profilePictureFile && profilePictureFile.size > 0) {
          profilePictureUrl = await uploadFile(profilePictureFile, 'avatars');
        }
        
        let bannerUrl: string | undefined = undefined;
        if (addBanner && bannerFile && bannerFile.size > 0) {
            bannerUrl = await uploadFile(bannerFile, 'banners');
        }

        // 3. Create user data object
        const newUser: Omit<User, 'id'> = {
          uid: firebaseUser.uid,
          username,
          displayName,
          email,
          about,
          profilePicture: profilePictureUrl,
          banner: bannerUrl,
          subscribers: 0,
          subscriptions: [],
          likedVideos: [],
          likedPosts: [],
          viewedVideos: [],
        };
        
        // 4. Save user data to our DB (via server action)
        const createdUser = await addUserAction(newUser);
        await db.addUser(createdUser);
        await db.setCurrentUser(createdUser);
        
        toast({
            title: "Kayıt Başarılı!",
            description: "Hesabınız oluşturuldu. Ana sayfaya yönlendiriliyorsunuz.",
        });
        router.push("/home");
        router.refresh();

    } catch (error: any) {
         let description = "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
         if (error.code === 'auth/email-already-in-use') {
            description = "Bu e-posta adresi zaten kullanılıyor.";
         } else if (error.code === 'auth/weak-password') {
            description = "Şifre çok zayıf. Lütfen en az 6 karakterli bir şifre seçin.";
         } else if (error.code === 'auth/invalid-email') {
            description = "Geçersiz e-posta adresi.";
         }
         console.error("Registration failed", error);
         toast({ title: "Kayıt Başarısız", description: description, variant: "destructive" });
    } finally {
        setIsRegistering(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm border-2 border-primary/20 shadow-xl shadow-primary/10">
      <CardHeader>
        <MyTubeLogo />
        <CardTitle className="text-2xl text-center">Kayıt Ol</CardTitle>
        <CardDescription className="text-center">
            Video paylaşmaya ve izlemeye başlamak için hesabınızı oluşturun.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input id="username" name="username" placeholder="kullanıcıadınız" required disabled={isRegistering || !db}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Görünen Ad</Label>
            <Input id="displayName" name="displayName" placeholder="Adınız" required disabled={isRegistering || !db}/>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" placeholder="ornek@eposta.com" required disabled={isRegistering || !db}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" name="password" type="password" required disabled={isRegistering || !db}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-picture">Profil Resmi</Label>
            <Input id="profile-picture" name="profile-picture" type="file" accept="image/*" disabled={isRegistering || !db}/>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="about">Hakkında</Label>
            <Textarea id="about" name="about" placeholder="Herkese kendinizden biraz bahsedin." disabled={isRegistering || !db}/>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="add-banner" checked={addBanner} onCheckedChange={(checked) => setAddBanner(checked as boolean)} disabled={isRegistering || !db}/>
            <label
              htmlFor="add-banner"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Bir banner eklemek istiyorum.
            </label>
          </div>
           {addBanner && (
            <div className="grid gap-2">
              <Label htmlFor="banner">Kanal Banner'ı</Label>
              <Input id="banner" name="banner" type="file" accept="image/*" required={addBanner} disabled={isRegistering || !db}/>
            </div>
           )}
          <Button type="submit" className="w-full" disabled={isRegistering || !db}>
            { !db ? "Sistem Yükleniyor..." : isRegistering ? "Kaydediliyor..." : "Hesap Oluştur" }
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Zaten bir hesabınız var mı?{" "}
          <Link href="/login" className="underline text-accent">
            Giriş Yap
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
