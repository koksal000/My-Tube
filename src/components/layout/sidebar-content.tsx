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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { mockUsers } from "@/lib/data"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const MyTubeLogo = () => (
    <Link href="/home" className="flex items-center gap-2 text-primary font-bold text-xl">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
        <span className="group-data-[collapsible=icon]:hidden">My-Tube</span>
    </Link>
)

export default function SidebarContentComponent() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  // TODO: Replace with actual current user data
  const currentMockUser = mockUsers[0];
  const subscriptions = mockUsers.filter(u => currentMockUser.subscriptions.includes(u.id));

  return (
    <>
      <SidebarHeader>
        <MyTubeLogo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/home')} tooltip="Home">
              <Link href="/home">
                <Home />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/explore')} tooltip="Explore">
              <Link href="/explore">
                <Compass />
                <span>Explore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/subscriptions')} tooltip="Subscriptions">
              <Link href="/subscriptions">
                <Youtube />
                <span>Subscriptions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator className="my-4" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/liked')} tooltip="Liked Videos">
              <Link href="/liked">
                <ThumbsUp />
                <span>Liked Videos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/history')} tooltip="History">
              <Link href="/history">
                <History />
                <span>History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <Separator className="my-4" />
        
        <div className="px-2 mb-2 text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
            Subscriptions
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
            <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
