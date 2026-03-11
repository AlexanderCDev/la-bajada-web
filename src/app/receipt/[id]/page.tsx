"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Store, MapPin, Receipt, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"

type Order = {
    id: string
    customer_name: string
    customer_phone: string
    delivery_type: string
    delivery_address: string | null
    payment_method: string
    order_total: number
    status: string
    created_at: string
}

type OrderItem = {
    quantity: number
    unit_price: number
    subtotal: number
    product: {
        name: string
    } | any
}

export default function ReceiptPage() {
    const params = useParams()
    const id = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [items, setItems] = useState<OrderItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return;

        async function fetchOrder() {
            try {
                // Fetch Order
                const { data: orderData, error: orderError } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("id", id)
                    .single()

                if (orderError) throw orderError

                if (!orderData) {
                    setError("Comprobante no encontrado")
                    setIsLoading(false)
                    return
                }

                setOrder(orderData)

                // Fetch Items
                const { data: itemsData, error: itemsError } = await supabase
                    .from("order_items")
                    .select(`
                        quantity,
                        unit_price,
                        subtotal,
                        product:products(name)
                    `)
                    .eq("order_id", id)

                if (itemsError) throw itemsError

                setItems(itemsData || [])

            } catch (err: any) {
                console.error("Error fetching receipt:", err)
                setError(err.message || JSON.stringify(err) || "Ocurrió un error al cargar el comprobante")
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrder()
    }, [id])

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary/10 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-foreground/60 font-medium text-lg animate-pulse">Buscando comprobante...</p>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-secondary/10 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-500/20">
                    <Receipt className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black mb-2 text-foreground">Ooops!</h1>
                <p className="text-foreground/60 text-lg">{error}</p>
                <Button
                    variant="outline"
                    className="mt-6 border-border rounded-xl"
                    onClick={() => window.location.href = '/'}
                >
                    Ir al inicio
                </Button>
            </div>
        )
    }

    const receiptNumber = `B001-${order.id.split("-")[0].toUpperCase()}`
    const dateObj = new Date(order.created_at)

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/10 to-secondary/30 flex flex-col items-center py-8 px-4 sm:px-6">
            <div className="w-full max-w-sm sm:max-w-md print:max-w-none print:w-full print:p-0">

                {/* Print Action - Hidden when printing */}
                <div className="flex justify-end mb-6 print:hidden">
                    <Button
                        onClick={handlePrint}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl font-bold flex items-center gap-2 px-6"
                    >
                        <Printer className="w-5 h-5" />
                        Descargar PDF
                    </Button>
                </div>

                {/* Receipt Card */}
                <Card className="bg-white text-black shadow-2xl border-0 rounded-3xl overflow-hidden print:shadow-none print:rounded-none mx-auto relative transform transition-all hover:scale-[1.01] duration-300">

                    {/* Top ticket decoration */}
                    <div className="absolute top-0 left-0 w-full h-3 bg-[radial-gradient(circle,white_4px,transparent_5px)] bg-[size:15px_15px] -top-1.5 print:hidden"></div>

                    <CardHeader className="bg-primary text-primary-foreground text-center py-10 rounded-b-[40px] print:bg-white print:text-black print:border-b-2 print:border-dashed print:rounded-none relative px-6 space-y-0">
                        <div className="mx-auto bg-white/20 print:bg-black/5 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-4 shadow-inner">
                            <Store className="w-12 h-12" />
                        </div>
                        <CardTitle className="text-4xl font-black tracking-tighter">LA BAJADA</CardTitle>
                        <p className="opacity-90 mt-1 font-bold text-sm tracking-widest uppercase">Sangucherías</p>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-10 space-y-8 relative">
                        {/* Meta */}
                        <div className="text-center space-y-1 pb-8 border-b-2 border-dashed border-gray-200">
                            <h2 className="text-sm font-bold text-gray-800 bg-gray-100 py-1.5 px-4 rounded-full inline-block mb-3 uppercase tracking-wider border border-gray-200">
                                Boleta de Venta
                            </h2>
                            <p className="font-mono text-2xl font-black text-gray-900 tracking-tight">{receiptNumber}</p>
                            <p className="text-sm text-gray-500 font-medium">
                                {dateObj.toLocaleDateString("es-PE", { year: 'numeric', month: 'long', day: 'numeric' })} - {dateObj.toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-4 pb-8 border-b-2 border-dashed border-gray-200 bg-gray-50/50 p-6 rounded-2xl mx-[-1rem]">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider"><Store className="w-3.5 h-3.5" />Cliente</p>
                                    <p className="font-bold text-gray-900">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider"><Phone className="w-3.5 h-3.5" />Teléfono</p>
                                    <p className="font-bold text-gray-900">{order.customer_phone}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500 mb-2 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider"><MapPin className="w-3.5 h-3.5" />Entrega</p>
                                <div className="flex items-start gap-2">
                                    <span className="bg-primary/20 text-primary-foreground text-xs font-black px-2.5 py-1 rounded capitalize shrink-0 shadow-sm border border-primary/20" style={{ color: 'var(--primary)' }}>
                                        {order.delivery_type}
                                    </span>
                                    {order.delivery_address && (
                                        <p className="font-semibold text-gray-900 text-sm">{order.delivery_address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="pt-2">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-200">
                                        <th className="text-left font-bold py-3 text-xs uppercase tracking-widest w-12">Cant</th>
                                        <th className="text-left font-bold py-3 text-xs uppercase tracking-widest pl-2">Descripción</th>
                                        <th className="text-right font-bold py-3 text-xs uppercase tracking-widest">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, idx) => {
                                        const productName = Array.isArray(item.product) ? item.product[0]?.name : item.product?.name;
                                        return (
                                            <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                                <td className="py-4 align-top font-black text-gray-800 text-base">{item.quantity}</td>
                                                <td className="py-4 pl-2 pr-2">
                                                    <p className="font-bold text-gray-900 leading-tight">{productName || 'Producto'}</p>
                                                </td>
                                                <td className="py-4 text-right align-top font-black text-gray-900 text-base whitespace-nowrap">
                                                    S/ {item.subtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-4 bg-gray-900 p-6 rounded-2xl text-white shadow-inner relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:rounded-none print:mt-8 print:border-t-2 print:border-black">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 print:hidden"></div>

                            <div className="flex justify-between items-center text-gray-300 print:text-gray-600 text-sm font-medium mb-3 relative z-10 print:mb-2">
                                <span>Subtotal</span>
                                <span className="font-bold">S/ {order.order_total.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xl font-black text-white print:text-black pt-4 border-t border-gray-700/50 print:border-gray-300 relative z-10">
                                <span>TOTAL PAGADO</span>
                                <span className="text-primary print:text-black text-2xl">S/ {order.order_total.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-400 print:text-gray-500 text-xs mt-4 pt-4 border-t border-gray-800/50 print:border-gray-200 relative z-10">
                                <span className="uppercase tracking-wider font-bold">Método de pago</span>
                                <span className="uppercase font-black bg-white/10 print:bg-gray-100 print:text-black px-3 py-1 rounded-full text-[10px] tracking-widest">{order.payment_method}</span>
                            </div>
                        </div>

                        <div className="text-center pt-8 pb-4 text-sm text-gray-400 font-bold tracking-wide">
                            <p>¡Gracias por tu preferencia!</p>
                            <p className="text-xs mt-1.5 opacity-60 uppercase tracking-widest font-black">labajada.com</p>
                        </div>
                    </CardContent>

                    {/* Bottom ticket decoration */}
                    <div className="absolute bottom-0 left-0 w-full h-3 bg-[radial-gradient(circle,white_4px,transparent_5px)] bg-[size:15px_15px] -bottom-1.5 rotate-180 print:hidden opacity-50"></div>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    )
}
