"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { mockUsers } from "@/lib/data"

const MyTubeLogo = () => (
    <div className="flex items-center justify-center space-x-2 text-primary font-bold text-2xl mb-4">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897-.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span>My-Tube Reborn</span>
    </div>
)

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast();

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;
    const password = formData.get("password") as string;
    // In a real app, you would handle file uploads properly.
    // For now, we will ignore profile picture and banner.

    // Check if username already exists
    if (mockUsers.some(user => user.username === username)) {
      toast({
        title: "Kayıt Başarısız",
        description: "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send data to a server to create a new user.
    // Since this is a client-side only prototype, we can't persist new users
    // without a backend or connecting to a DB like IndexedDB.
    // For now, we'll just show a success message and redirect.
    console.log("New user would be created with:", { username, displayName, password });
    toast({
        title: "Kayıt Başarılı!",
        description: "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
    });
    router.push("/login")
  }

  return (
    <Card className="mx-auto max-w-sm border-2 border-primary/20 shadow-xl shadow-primary/10">
      <CardHeader>
        <MyTubeLogo />
        <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
        <CardDescription className="text-center">
            Create your account to start sharing and watching videos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="yourusername" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" name="displayName" placeholder="Your Name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-picture">Profile Picture</Label>
            <Input id="profile-picture" name="profile-picture" type="file" accept="image/*" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="banner">Channel Banner</Label>
            <Input id="banner" name="banner" type="file" accept="image/*" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required/>
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I want to add a banner.
            </label>
          </div>
          <Button type="submit" className="w-full">
            Create an account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline text-accent">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
