"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session && pathname !== "/admin/login") {
                    router.push("/admin/login")
                } else if (session && pathname === "/admin/login") {
                    router.push("/admin")
                } else {
                    setIsAuthenticated(!!session)
                }
            } catch (error) {
                console.error("Auth error:", error)
                if (pathname !== "/admin/login") {
                    router.push("/admin/login")
                }
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session)
            if (!session && pathname !== "/admin/login") {
                router.push("/admin/login")
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [pathname, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    // If we are on the login page, just render it (auth check is handled)
    if (pathname === "/admin/login") {
        return <>{children}</>
    }

    // If not authenticated and not on login page, render nothing (will redirect)
    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}
