"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, FileText, Printer, CheckCircle2 } from "lucide-react"
import { ComprobanteModal } from "@/components/admin/comprobante-modal"

type Order = {
    id: string
    customer_name: string
    customer_phone: string
    order_total: number
    status: string
    created_at: string
}

type OrderItem = {
    quantity: number
    subtotal: number
    product: {
        name: string
    }
}

export default function ComprobantesPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterPeriod, setFilterPeriod] = useState("all")
    const [isLoading, setIsLoading] = useState(true)

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("payment_status", "success")
                .order("created_at", { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error("Error fetching orders:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openComprobante = async (order: Order) => {
        try {
            const { data, error } = await supabase
                .from("order_items")
                .select(`
                    quantity,
                    subtotal,
                    product:products(name)
                `)
                .eq("order_id", order.id)

            if (error) throw error

            setSelectedOrderItems(data as any || [])
            setSelectedOrder(order)
            setIsModalOpen(true)
        } catch (error) {
            console.error("Error fetching order items:", error)
        }
    }

    const handlePrint = () => {
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleWhatsApp = () => {
        if (!selectedOrder) return

        // Formatear el número (quitar espacios, asumir Perú +51 si no hay código)
        let phone = selectedOrder.customer_phone.replace(/\s+/g, '')
        if (!phone.startsWith('+')) {
            phone = `51${phone}`
        }

        const receiptNumber = `B001-${selectedOrder.id.split("-")[0].toUpperCase()}`
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const message = `¡Hola ${selectedOrder.customer_name}! 🥪 Somos La Bajada.\n\nAquí tienes tu comprobante electrónico de tu última compra con nosotros.\n\n🧾 Boleta: ${receiptNumber}\n💰 Monto Total: S/ ${selectedOrder.order_total.toFixed(2)}\n🔗 Puedes ver tu recibo digital aquí: ${siteUrl}/receipt/${selectedOrder.id}\n\n¡Gracias por tu preferencia! Qué lo disfrutes.`

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    // Filtering
    const filteredOrders = useMemo(() => {
        let result = orders

        // Filter by Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(o =>
                o.customer_name?.toLowerCase().includes(term) ||
                o.id.toLowerCase().includes(term)
            )
        }

        // Filter by Date
        if (filterPeriod !== "all") {
            const now = new Date()
            result = result.filter(o => {
                const orderDate = new Date(o.created_at)
                if (filterPeriod === "today") {
                    return orderDate.toDateString() === now.toDateString()
                } else if (filterPeriod === "week") {
                    const weekAgo = new Date(now.setDate(now.getDate() - 7))
                    return orderDate >= weekAgo
                } else if (filterPeriod === "month") {
                    const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
                    return orderDate >= monthAgo
                }
                return true
            })
        }

        return result
    }, [orders, searchTerm, filterPeriod])

    // KPIs
    const totalComprobantes = filteredOrders.length
    const totalMonto = filteredOrders.reduce((sum, o) => sum + o.order_total, 0)
    // Para simplificar, asumimos que todos los generados son activos/válidos.
    const activosCount = filteredOrders.length

    return (
        <div className="p-8 h-screen flex flex-col overflow-hidden">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Gestión de Comprobantes</h1>
                <p className="text-foreground/60">Administra y consulta todos los comprobantes emitidos</p>
            </div>

            {/* KPI Cards (Matching User's Reference) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                <Card className="bg-[#3B82F6] text-white shadow-md border-none h-28 flex flex-col justify-center relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-white/80 font-medium text-sm mb-1 relative z-10">Total Comprobantes</p>
                        <h3 className="text-4xl font-bold relative z-10">{totalComprobantes}</h3>
                        <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/10" />
                    </CardContent>
                </Card>

                <Card className="bg-[#22C55E] text-white shadow-md border-none h-28 flex flex-col justify-center relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-white/80 font-medium text-sm mb-1 relative z-10">Comprobantes Activos</p>
                        <h3 className="text-4xl font-bold relative z-10">{activosCount}</h3>
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/10" />
                    </CardContent>
                </Card>

                <Card className="bg-[#F97316] text-white shadow-md border-none h-28 flex flex-col justify-center relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-white/80 font-medium text-sm mb-1 relative z-10">Monto Total</p>
                        <h3 className="text-4xl font-bold relative z-10">S/ {totalMonto.toFixed(2)}</h3>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl font-black text-white/10">S/</span>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-surface border border-border rounded-2xl p-4 mb-6 shrink-0 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-semibold text-foreground/50 uppercase">Buscar</label>
                    <Input
                        placeholder="Buscar por cliente o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-background h-10"
                    />
                </div>
                <div className="w-full md:w-64 space-y-1">
                    <label className="text-xs font-semibold text-foreground/50 uppercase">Fecha</label>
                    <select
                        className="w-full h-10 flex bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                    >
                        <option value="all">Todas</option>
                        <option value="today">Hoy</option>
                        <option value="week">Últimos 7 días</option>
                        <option value="month">Último mes</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface border border-border rounded-2xl flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-secondary/5 z-10 shadow-sm">
                            <tr className="border-b border-border text-foreground/60 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 px-6">N° Comprobante</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border overflow-y-auto">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-foreground/50">Cargando comprobantes...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-foreground/50">No se encontraron comprobantes.</td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const receiptNumber = `B001-${order.id.split("-")[0].toUpperCase()}`
                                    const dateObj = new Date(order.created_at)
                                    const formattedDate = dateObj.toLocaleString("es-PE", {
                                        day: "2-digit", month: "2-digit", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })

                                    return (
                                        <tr key={order.id} className="hover:bg-secondary/5 transition-colors group">
                                            <td className="p-4 px-6 font-bold text-sm">{receiptNumber}</td>
                                            <td className="p-4 text-sm text-foreground/70">{formattedDate}</td>
                                            <td className="p-4 text-sm font-medium">{order.customer_name}</td>
                                            <td className="p-4 text-right font-bold text-primary">S/ {order.order_total.toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                                    Activo
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 h-8 w-8 transition-colors"
                                                    onClick={() => openComprobante(order)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ComprobanteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                items={selectedOrderItems}
                onPrint={handlePrint}
                onSendWhatsApp={handleWhatsApp}
            />

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    /* Ocultar botones e interfaces dentro del comprobante si los hay */
                    @page { margin: 0; size: auto; }
                }
            `}</style>
        </div>
    )
}
