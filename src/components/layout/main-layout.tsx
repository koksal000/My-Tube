"use client"

import {
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar"
import Header from "./header"
import SidebarContent from "./sidebar-content"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </>
  )
}
