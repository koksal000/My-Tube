import { SidebarProvider } from "@/components/ui/sidebar"
import MainLayout from "@/components/layout/main-layout"
import { DatabaseProvider } from "@/lib/db"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DatabaseProvider>
      <SidebarProvider>
        <MainLayout>{children}</MainLayout>
      </SidebarProvider>
    </DatabaseProvider>
  )
}
