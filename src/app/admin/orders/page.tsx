"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, Store } from "lucide-react"

type OrderItem = {
    id: string
    quantity: number
    unit_price: number
    subtotal: number
    product: {
        name: string
    } | null
}

type Order = {
    id: string
    customer_name: string
    customer_phone: string
    order_total: number
    status: string
    payment_status: string
    payment_id: string
    created_at: string
    delivery_type: string
    comments: string
    items?: OrderItem[]
}

const COLUMNS = [
    { id: "Pendiente de Pago", label: "⏳ Pago Pendiente", bg: "bg-orange-500/10 text-orange-600 border-orange-200" },
    { id: "Recibido", label: "🟡 Recibido", bg: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
    { id: "En preparación", label: "🔵 En preparación", bg: "bg-blue-500/10 text-blue-600 border-blue-200" },
    { id: "Listo", label: "🟢 Listo para recoger", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    { id: "Enviado", label: "🚚 Enviado", bg: "bg-purple-500/10 text-purple-600 border-purple-200" },
    { id: "Completado", label: "✅ Completado", bg: "bg-background text-foreground/50 border-border" }
]

export default function OrdersKanban() {
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        fetchOrders()

        const channel = supabase
            .channel("public:orders")
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                // Play notification sound on new insert
                if (payload.eventType === 'INSERT') {
                    try {
                        const audio = new Audio("https://cdn.freesound.org/previews/415/415039_7082496-lq.mp3")
                        audio.play().catch(e => console.log("Can't play audio automatically", e))
                    } catch (e) { }
                }

                // Refresh orders 
                fetchOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchOrders = async () => {
        // Only fetch orders from today or active orders
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                items:order_items (
                    id, quantity, unit_price, subtotal,
                    product:products (name)
                )
            `)
            .gte("created_at", startOfDay.toISOString())
            .order("created_at", { ascending: false })

        if (data) setOrders(data)
    }

    const updateStatus = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId)

        if (!error) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        }
    }

    const confirmPayment = async (orderId: string) => {
        if (!window.confirm("¿Seguro que deseas confirmar el pago de este pedido manualmente?")) return

        const { error } = await supabase
            .from("orders")
            .update({
                status: "Recibido",
                payment_status: "success"
            })
            .eq("id", orderId)

        if (!error) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Recibido", payment_status: "success" } : o))
        }
    }

    // Handle simple Drag and Drop
    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        e.dataTransfer.setData("orderId", orderId)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault()
        const orderId = e.dataTransfer.getData("orderId")
        if (orderId) {
            updateStatus(orderId, status)
        }
    }

    return (
        <div className="p-4 md:p-8 h-[calc(100vh)] overflow-hidden flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Órdenes en Tiempo Real</h1>
                <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full animate-pulse">
                    Sincronizado
                </p>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
                {COLUMNS.map(col => {
                    const columnOrders = orders.filter(o => o.status === col.id)

                    return (
                        <div
                            key={col.id}
                            className="min-w-[300px] w-[350px] shrink-0 bg-surface/50 border border-border rounded-2xl flex flex-col h-full snap-center"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className={`p-4 font-bold border-b rounded-t-2xl ${col.bg}`}>
                                {col.label} <span className="float-right bg-white/50 text-black px-2 py-0.5 rounded-full text-xs">{columnOrders.length}</span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                {columnOrders.map(order => (
                                    <Card
                                        key={order.id}
                                        className="cursor-move hover:shadow-md transition-shadow active:scale-[0.98]"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                    >
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-lg leading-none">{order.customer_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-sm text-foreground/50 font-mono">#{order.id.split("-")[0]}</p>
                                                        {order.payment_status === "success" && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                                                                💳 Pagado
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="font-bold text-primary">S/ {order.order_total.toFixed(2)}</p>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                                                {order.delivery_type === "Delivery" ? <MapPin className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                                {order.delivery_type}
                                                <span className="mx-1">•</span>
                                                <Clock className="w-4 h-4" />
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>

                                            {order.items && order.items.length > 0 && (
                                                <div className="bg-secondary/5 p-2 rounded-md space-y-1 mb-2">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex justify-between text-xs">
                                                            <span><span className="font-bold">{item.quantity}x</span> {item.product?.name || 'Producto'}</span>
                                                            <span className="text-foreground/70">S/ {item.subtotal.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {order.comments && (
                                                <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 text-xs p-2 rounded-md border border-yellow-500/20 italic mb-2">
                                                    "{order.comments}"
                                                </div>
                                            )}

                                             <div className="pt-2 border-t border-border flex flex-wrap gap-2 text-xs">
                                                 {/* Status buttons to move manually if D&D is hard on mobile */}
                                                 {col.id === "Pendiente de Pago" && (
                                                     <button
                                                         onClick={() => confirmPayment(order.id)}
                                                         className="bg-green-500/10 text-green-600 px-2 py-1 rounded hover:bg-green-500/20 font-bold"
                                                     >
                                                         Confirmar Pago ✓
                                                     </button>
                                                 )}
                                                 {col.id === "Recibido" && <button onClick={() => updateStatus(order.id, "En preparación")} className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded hover:bg-blue-500/20">Preparar &rarr;</button>}
                                                 {col.id === "En preparación" && <button onClick={() => updateStatus(order.id, "Listo")} className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-500/20">Listo &rarr;</button>}
                                                 {col.id === "Listo" && order.delivery_type === "Delivery" && <button onClick={() => updateStatus(order.id, "Enviado")} className="bg-purple-500/10 text-purple-600 px-2 py-1 rounded hover:bg-purple-500/20">Enviar &rarr;</button>}
                                                 {(col.id === "Listo" || col.id === "Enviado") && <button onClick={() => updateStatus(order.id, "Completado")} className="bg-foreground/10 text-foreground px-2 py-1 rounded hover:bg-foreground/20">Completar ✓</button>}
                                                 {(col.id !== "Completado") && <button onClick={() => { if (window.confirm("¿Estás seguro de cancelar este pedido?")) updateStatus(order.id, "Cancelado") }} className="bg-red-500/10 text-red-600 px-2 py-1 rounded hover:bg-red-500/20 ml-auto">Cancelar ❌</button>}
                                             </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {columnOrders.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-foreground/30 text-sm font-medium italic border-2 border-dashed border-border rounded-xl p-8">
                                        Arrastra aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
