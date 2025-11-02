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
import { useDatabase } from "@/lib/db-provider"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

export default function Header() {
  const router = useRouter();
  const db = useDatabase();
  const { auth, user: firebaseUser, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (authLoading || !db) return;

    const syncUser = async () => {
      if (firebaseUser) {
        const dbUser = await db.getUser(firebaseUser.uid);
        setCurrentUser(dbUser);
        if (dbUser) {
            const notifications = await db.getNotifications(dbUser.id);
            setUnreadNotifications(notifications.filter(n => !n.read).length);
        }
      } else {
        setCurrentUser(null);
      }
    };
    syncUser();

     const interval = setInterval(async () => {
        if (db && firebaseUser) {
            const dbUser = await db.getUser(firebaseUser.uid);
             if (dbUser) {
                const notifications = await db.getNotifications(dbUser.id);
                const newUnreadCount = notifications.filter(n => !n.read).length;
                if (newUnreadCount !== unreadNotifications) {
                  setUnreadNotifications(newUnreadCount);
                }
            }
        }
    }, 5000); 

    return () => clearInterval(interval);

  }, [authLoading, firebaseUser, db, unreadNotifications]);
  
  const handleLogout = async () => {
    if (!db || !auth) return;
    await signOut(auth);
    await db.logout();
    setCurrentUser(null);
    router.push('/login');
    router.refresh(); 
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("search") as string;
    if (query) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  if (authLoading || !db) {
    return (
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6" />
    )
  }

  if (!firebaseUser || !currentUser) {
     return (
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
         <SidebarTrigger className="md:hidden" />
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
            <Button asChild>
                <Link href="/login">Giriş Yap</Link>
            </Button>
             <Button variant="outline" asChild>
                <Link href="/register">Kayıt Ol</Link>
            </Button>
          </div>
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
        <Button variant="ghost" size="icon" className="rounded-full relative" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
            )}
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
                <AvatarImage src={currentUser.profilePicture} alt={currentUser.displayName || currentUser.username} data-ai-hint="person face"/>
                <AvatarFallback>{(currentUser.displayName || currentUser.username || 'U').charAt(0)}</AvatarFallback>
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
