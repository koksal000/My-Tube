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

const MyTubeLogo = () => (
    <div className="flex items-center justify-center space-x-2 text-primary font-bold text-2xl mb-4">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span>My-Tube Reborn</span>
    </div>
)

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast();
  const [addBanner, setAddBanner] = React.useState(false);


  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;
    const password = formData.get("password") as string;
    const profilePictureFile = formData.get("profile-picture") as File | null;
    const bannerFile = formData.get("banner") as File | null;
    
    // Get all users from localStorage, or start with an empty array if none exist
    const storedUsers = localStorage.getItem("myTubeUsers");
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];

    // Check if username already exists
    if (allUsers.some(user => user.username === username)) {
      toast({
        title: "Kayıt Başarısız",
        description: "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.",
        variant: "destructive",
      });
      return;
    }
    
    let profilePictureBase64 = "data:image/png;base64,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";
    if (profilePictureFile && profilePictureFile.size > 0) {
      profilePictureBase64 = await toBase64(profilePictureFile);
    }
    
    let bannerBase64: string | undefined = undefined;
    if (addBanner && bannerFile && bannerFile.size > 0) {
        bannerBase64 = await toBase64(bannerFile);
    }

    // Create a new user object. In a real app, this would be more robust.
    const newUser: Omit<User, 'password'> = {
      id: `user${allUsers.length + 1}`,
      username,
      displayName,
      profilePicture: profilePictureBase64,
      banner: bannerBase64,
      subscribers: 0,
      subscriptions: [],
      likedVideos: [],
      viewedVideos: [],
    };
    
    // Add password separately for the object to be stored
    const newUserWithPassword = { ...newUser, password };

    // Add the new user to the list
    const updatedUsers = [...allUsers, newUserWithPassword];

    // Save the updated user list to localStorage
    localStorage.setItem("myTubeUsers", JSON.stringify(updatedUsers));
    
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
          <div className="flex items-center space-x-2">
            <Checkbox id="add-banner" checked={addBanner} onCheckedChange={(checked) => setAddBanner(checked as boolean)} />
            <label
              htmlFor="add-banner"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I want to add a banner.
            </label>
          </div>
           {addBanner && (
            <div className="grid gap-2">
              <Label htmlFor="banner">Channel Banner</Label>
              <Input id="banner" name="banner" type="file" accept="image/*" required={addBanner} />
            </div>
           )}
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

    