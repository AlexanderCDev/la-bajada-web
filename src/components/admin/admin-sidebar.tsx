"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, UtensilsCrossed, ListOrdered, LogOut, BarChart3, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Menú", href: "/admin/menu", icon: UtensilsCrossed },
    { name: "Órdenes", href: "/admin/orders", icon: ListOrdered },
    { name: "Reportes", href: "/admin/reports", icon: BarChart3 },
    { name: "Comprobantes", href: "/admin/comprobantes", icon: FileText },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/admin/login")
    }

    if (pathname === "/admin/login") return null

    return (
        <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col sticky top-0 hidden md:flex">
            <div className="p-6 border-b border-border">
                <Link href="/" className="font-bold text-2xl text-primary flex items-center gap-2">
                    🥪 <span className="text-foreground">La Bajada</span>
                </Link>
                <p className="text-xs text-foreground/50 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-foreground/70 hover:bg-secondary/10 hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-red-500 hover:bg-red-500/10"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    )
}
