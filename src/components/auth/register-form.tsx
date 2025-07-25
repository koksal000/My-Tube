"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MyTubeLogo = () => (
    <div className="flex items-center justify-center space-x-2 text-primary font-bold text-2xl mb-4">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span>My-Tube Reborn</span>
    </div>
)

export function RegisterForm() {
  const router = useRouter()

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault()
    // In a real app, you'd handle registration logic here.
    // For now, we just navigate to the login page after "registering".
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
            <Input id="username" placeholder="yourusername" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" placeholder="Your Name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-picture">Profile Picture</Label>
            <Input id="profile-picture" type="file" />
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
