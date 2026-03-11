"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, MapPin, Package, ArrowLeft, CreditCard } from "lucide-react"
import { motion } from "framer-motion"

export default function OrderSuccessPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = params.id as string

    // Check if coming back from Mercado Pago success
    const isPaymentSuccess = searchParams.get('payment_status') === 'success';

    const [confirming, setConfirming] = useState(isPaymentSuccess)

    useEffect(() => {
        const confirmOrder = async () => {
            if (isPaymentSuccess && orderId) {
                setConfirming(true)
                try {
                    // Get current status
                    const { data } = await supabase.from('orders').select('status, payment_status').eq('id', orderId).single()

                    // Only update if it's currently pending
                    if (data && data.status === 'Pendiente de Pago') {
                        await supabase.from('orders').update({
                            status: 'Recibido',
                            payment_status: 'success'
                        }).eq('id', orderId)
                    }
                } catch (error) {
                    console.error("Error confirming order:", error)
                } finally {
                    setConfirming(false)
                }
            }
        }

        confirmOrder()
    }, [isPaymentSuccess, orderId])

    // Note: in a real app we'd fetch the order details from Supabase using the ID
    // to show exact items and total.

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center py-20 relative overflow-hidden">
                {isPaymentSuccess && (
                    <div className="absolute inset-0 pointer-events-none z-0 flex justify-center">
                        <motion.div
                            initial={{ opacity: 1, y: -50 }}
                            animate={{ opacity: 0, y: 500 }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            className="text-6xl"
                        >
                            🎉🍔🎊
                        </motion.div>
                    </div>
                )}

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full bg-surface rounded-3xl p-8 text-center shadow-2xl border-2 border-primary/20 relative z-10"
                >
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <h1 className="text-3xl font-black mb-2 tracking-tight text-secondary">
                        {isPaymentSuccess ? "¡Pago Exitoso!" : "¡Pedido Confirmado!"}
                    </h1>
                    <p className="text-foreground/70 mb-8 font-medium">
                        {isPaymentSuccess
                            ? "Tu pago ha sido procesado de forma segura. Ya estamos preparando todo."
                            : "Tu pedido ha sido recibido y ya estamos preparándolo."}
                    </p>

                    <div className="bg-background rounded-2xl p-6 text-left space-y-4 mb-8 border border-border">
                        <div className="flex justify-between items-center pb-4 border-b border-border">
                            <span className="text-sm text-foreground/60">Orden #</span>
                            <span className="font-mono font-medium text-sm">{orderId?.slice(0, 8) || "N/A"}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium text-secondary">Estado actual</p>
                                <p className="text-xs text-foreground/60">{isPaymentSuccess ? "Pagado y en preparación" : "Recibido - En cola de preparación"}</p>
                            </div>
                        </div>

                        {isPaymentSuccess && (
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium text-secondary">Pago Seguro</p>
                                    <p className="text-xs text-foreground/60">Aprobado vía Mercado Pago</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Tiempo estimado</p>
                                <p className="text-xs text-foreground/60">15 - 20 minutos</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full text-lg h-12 rounded-xl font-bold" asChild>
                            <Link href="/menu">Pedir Nuevamente</Link>
                        </Button>
                        <Button variant="ghost" className="w-full text-foreground/60 hover:text-foreground h-12 rounded-xl" onClick={() => router.push('/')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al Inicio
                        </Button>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
