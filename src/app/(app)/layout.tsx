import { SidebarProvider } from "@/components/ui/sidebar"
import MainLayout from "@/components/layout/main-layout"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  )
}
