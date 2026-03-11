import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-background text-foreground">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden min-h-screen">
                    {children}
                </main>
            </div>
        </AdminGuard>
    )
}
