"use client"

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Compass,
  Youtube,
  ThumbsUp,
  History,
  Settings,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import React, { useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getAllUsers, getCurrentUser, getUserById } from "@/lib/db"

const MyTubeLogo = () => (
    <Link href="/home" className="flex items-center gap-2 text-primary font-bold text-xl">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266-4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span className="group-data-[collapsible=icon]:hidden">My-Tube</span>
    </Link>
)

export default function SidebarContentComponent() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<User[]>([]);

  useEffect(() => {
    const fetchUserAndSubs = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const subUsers = await Promise.all(user.subscriptions.map(id => getUserById(id)));
        setSubscriptions(subUsers.filter((u): u is User => !!u));
      }
    };
    fetchUserAndSubs();
  }, [pathname]); // Re-fetch on path change to keep data fresh


  return (
    <>
      <SidebarHeader>
        <MyTubeLogo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/home')} tooltip="Ana Sayfa">
              <Link href="/home">
                <Home />
                <span>Ana Sayfa</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/explore')} tooltip="Keşfet">
              <Link href="/explore">
                <Compass />
                <span>Keşfet</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/flow')} tooltip="Akış">
              <Link href="/flow">
                <Flame />
                <span>Akış</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/subscriptions')} tooltip="Abonelikler">
              <Link href="/subscriptions">
                <Youtube />
                <span>Abonelikler</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator className="my-4" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/liked')} tooltip="Beğenilenler">
              <Link href="/liked">
                <ThumbsUp />
                <span>Beğenilenler</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/history')} tooltip="Geçmiş">
              <Link href="/history">
                <History />
                <span>Geçmiş</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <Separator className="my-4" />
        
        <div className="px-2 mb-2 text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
            Abonelikler
        </div>
        <SidebarMenu>
            {subscriptions.map(sub => (
                 <SidebarMenuItem key={sub.id}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(`/channel/${sub.username}`)} tooltip={sub.displayName}>
                        <Link href={`/channel/${sub.username}`}>
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={sub.profilePicture} alt={sub.displayName} data-ai-hint="person face" />
                                <AvatarFallback>{sub.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{sub.displayName}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>

      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Ayarlar">
              <Link href="/settings">
                <Settings />
                <span>Ayarlar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
