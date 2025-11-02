import { SidebarProvider } from "@/components/ui/sidebar"
import MainLayout from "@/components/layout/main-layout"
import { DatabaseProvider } from "@/lib/db-provider"
import { AuthCheck } from "@/firebase/auth-check";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DatabaseProvider>
      <AuthCheck>
        <SidebarProvider>
          <MainLayout>{children}</MainLayout>
        </SidebarProvider>
      </AuthCheck>
    </DatabaseProvider>
  )
}
