"use client"

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getCurrentUser, logout } from "@/lib/data"

export default function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      setLoading(false);
    }
    fetchUser();
  }, [router]);
  
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    router.push('/login');
    router.refresh(); // To update sidebar etc.
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("search") as string;
    if (query) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  if (loading || !currentUser) {
    return (
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        {/* Render a loading state or a slimmed-down header for logged-out users */}
       </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial" onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Video ve kanal ara..."
              className="rounded-full pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Bildirimleri aç/kapat</span>
          </Link>
        </Button>
        <Button asChild className="gap-1 rounded-full bg-primary hover:bg-primary/90">
          <Link href="/upload">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yükle</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.profilePicture} alt={currentUser.displayName} data-ai-hint="person face"/>
                <AvatarFallback>{currentUser.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
                <Link href={`/channel/${currentUser.username}`}>Kanalım</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/messages">Mesajlar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/settings">Ayarlar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={handleLogout}>
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
