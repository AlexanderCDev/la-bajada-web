"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Lock } from "lucide-react"

export default function AdminLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            toast.success("¡Bienvenido, Administrador!")
            router.push("/admin")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Credenciales incorrectas")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-full shadow-2xl border-border">
                <CardHeader className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl">Acceso Administrativo</CardTitle>
                    <CardDescription>
                        Panel exclusivo para el restaurante La Bajada.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Correo electrónico</label>
                            <Input
                                type="email"
                                placeholder="admin@labajada.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contraseña</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                            {loading ? "Verificando..." : "Ingresar"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
