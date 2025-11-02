"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { useDatabase } from "@/lib/db-provider"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

const MyTubeLogo = () => (
    <div className="flex items-center justify-center space-x-2 text-primary font-bold text-2xl mb-4">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span>My-Tube Reborn</span>
    </div>
)

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useDatabase();
  const { auth } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!db || !auth) {
        toast({ title: "Sistem hazır değil, lütfen bekleyin.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const user = await db.getUser(firebaseUser.uid);
        if (user) {
            await db.setCurrentUser(user);
             toast({
                title: "Giriş Başarılı!",
                description: "Ana sayfaya yönlendiriliyorsunuz.",
            });
            router.push("/home")
            router.refresh();
        } else {
             throw new Error("Kullanıcı veritabanında bulunamadı.");
        }
    } catch (error: any) {
        let description = "Kullanıcı adı veya şifre hatalı.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "E-posta veya şifre hatalı.";
        } else {
            console.error("Firebase Auth Error:", error);
            description = "Giriş sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
        toast({
            title: "Giriş Başarısız",
            description: description,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm border-2 border-primary/20 shadow-xl shadow-primary/10">
      <CardHeader>
        <MyTubeLogo />
        <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
        <CardDescription className="text-center">
          Hesabınıza giriş yapmak için bilgilerinizi girin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" name="email" type="email" placeholder="ornek@eposta.com" required disabled={isLoading}/>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Şifre</Label>
            </div>
            <Input id="password" name="password" type="password" required disabled={isLoading}/>
          </div>
          <Button type="submit" className="w-full" disabled={!db || isLoading}>
            { isLoading ? "Giriş Yapılıyor..." : "Giriş Yap" }
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="underline text-accent">
            Kayıt Ol
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
