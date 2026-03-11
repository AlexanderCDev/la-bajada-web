"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useStore } from "@/store"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { MapPin, Store } from "lucide-react"

export default function CheckoutPage() {
    const router = useRouter()
    const { cart, cartTotal, clearCart } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    const [formData, setFormData] = useState({
        customer_name: "",
        customer_phone: "",
        delivery_type: "Recoger en tienda",
        comments: ""
    })

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    if (cart.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center py-20 text-center">
                    <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
                    <p className="text-foreground/70 mb-8">Parece que aún no has agregado productos a tu carrito.</p>
                    <Button onClick={() => router.push("/menu")}>Volver al Menú</Button>
                </main>
                <Footer />
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.customer_name || !formData.customer_phone) {
            toast.error("Por favor completa tu nombre y celular")
            return
        }

        setIsSubmitting(true)

        try {
            const total = cartTotal()

            // 1. Create order
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert({
                    customer_name: formData.customer_name,
                    customer_phone: formData.customer_phone,
                    order_total: total,
                    status: "Pendiente de Pago",
                    payment_status: "pending", 
                    delivery_type: formData.delivery_type,
                    comments: formData.comments
                })
                .select()
                .single()

            if (orderError) throw orderError

            // 2. Create order items
            const orderItems = cart.map(item => {
                // Check if it's a UUID, otherwise it's a fake promo ID
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product.id)

                return {
                    order_id: orderData.id,
                    product_id: isUuid ? item.product.id : null, // Set null to avoid UUID syntax error
                    quantity: item.quantity,
                    unit_price: item.product.price,
                    subtotal: item.product.price * item.quantity,
                    // Optionally we could store the name if there's a column for it,
                    // but since we only have product_id, we just leave it null for promos
                    // so it doesn't break the insert
                }
            })

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems)

            if (itemsError) throw itemsError

            // 3. Initiate Mercado Pago Payment
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderData.id,
                    items: cart.map(item => ({
                        product_id: item.product.id,
                        title: item.product.name,
                        quantity: item.quantity,
                        unit_price: item.product.price
                    }))
                })
            })

            const mpData = await response.json()
            if (mpData.init_point) {
                // Clear cart locally first since we are leaving the site
                clearCart()
                // Redirect user to Mercado Pago Checkout Pro
                window.location.href = mpData.init_point
            } else {
                toast.error("Error iniciando el pago contáctanos")
                console.error("MP Error:", mpData.error)
            }

        } catch (error) {
            console.error("Error creating order:", error)
            toast.error("Hubo un problema procesando tu orden. Intenta nuevamente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
                <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Completar Pedido</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Checkout */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tus Datos</CardTitle>
                                <CardDescription>Información para confirmar tu pedido.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre Completo *</label>
                                        <Input
                                            placeholder="Ej. Juan Pérez"
                                            value={formData.customer_name}
                                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Celular / WhatsApp *</label>
                                        <Input
                                            type="tel"
                                            placeholder="Ej. 987654321"
                                            value={formData.customer_phone}
                                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Entrega</CardTitle>
                                <CardDescription>¿Cómo deseas recibir tu pedido?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setFormData({ ...formData, delivery_type: "Recoger en tienda" })}
                                        className={`border-2 rounded-xl p-4 flex gap-3 cursor-pointer transition-colors ${formData.delivery_type === "Recoger en tienda" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full h-fit ${formData.delivery_type === "Recoger en tienda" ? "bg-primary/20 text-primary" : "bg-secondary/10"}`}>
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Recoger en tienda</h4>
                                            <p className="text-sm text-foreground/60">Gratis. Listo en aprox. 15-20 min.</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFormData({ ...formData, delivery_type: "Delivery" })}
                                        className={`border-2 rounded-xl p-4 flex gap-3 cursor-pointer transition-colors ${formData.delivery_type === "Delivery" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                                            }`}
                                    >
                                        <div className={`p-2 rounded-full h-fit ${formData.delivery_type === "Delivery" ? "bg-primary/20 text-primary" : "bg-secondary/10"}`}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Delivery</h4>
                                            <p className="text-sm text-foreground/60">Costo adicional según zona.</p>
                                        </div>
                                    </div>
                                </div>

                                {formData.delivery_type === "Delivery" && (
                                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-xl text-sm">
                                        <strong>Nota:</strong> Nos comunicaremos contigo al WhatsApp para coordinar la dirección exacta y el costo de envío.
                                    </div>
                                )}

                                <div className="mt-6 space-y-2">
                                    <label className="text-sm font-medium">Comentarios adicionales (Opcional)</label>
                                    <textarea
                                        className="w-full flex min-h-[80px] rounded-xl border border-border bg-transparent px-4 py-2 text-sm shadow-sm placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        placeholder="Sin cebolla, extra mayonesa, etc."
                                        value={formData.comments}
                                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 border-primary/20 shadow-md">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 rounded-t-xl">
                                <CardTitle>Resumen del Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {cart.map((item) => (
                                        <div key={item.product.id} className="flex justify-between items-start text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-primary">{item.quantity}x</span>
                                                <span className="text-foreground/80 line-clamp-2">{item.product.name}</span>
                                            </div>
                                            <span className="font-medium shrink-0 ml-4">
                                                S/ {(item.product.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-border space-y-2">
                                    <div className="flex justify-between text-foreground/70 text-sm">
                                        <span>Subtotal</span>
                                        <span>S/ {cartTotal().toFixed(2)}</span>
                                    </div>
                                    {formData.delivery_type === "Delivery" && (
                                        <div className="flex justify-between text-foreground/70 text-sm">
                                            <span>Delivery</span>
                                            <span className="text-xs">Por confirmar</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-border">
                                        <span>Total a pagar</span>
                                        <span className="text-primary">S/ {cartTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pb-6">
                                <Button
                                    className="w-full h-14 text-lg bg-[#009EE3] hover:bg-[#008CCh] text-white"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Procesando..." : "Pagar con Mercado Pago"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
