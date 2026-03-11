import { QRCodeSVG } from "qrcode.react"
import { Printer, Download, MessageCircle, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type OrderItem = {
    quantity: number
    subtotal: number
    product: {
        name: string
    }
}

type Order = {
    id: string
    customer_name: string
    customer_phone: string
    order_total: number
    status: string
    created_at: string
}

interface ComprobanteModalProps {
    isOpen: boolean
    onClose: () => void
    order: Order | null
    items: OrderItem[]
    onPrint?: () => void
    onDownloadPDF?: () => void
    onSendWhatsApp?: () => void
}

export function ComprobanteModal({
    isOpen,
    onClose,
    order,
    items,
    onPrint,
    onDownloadPDF,
    onSendWhatsApp
}: ComprobanteModalProps) {
    if (!isOpen || !order) return null

    // Generate a simple receipt number from order ID (e.g. B001-XXXX)
    const receiptNumber = `B001-${order.id.split("-")[0].toUpperCase()}`

    // Formatting date
    const dateObj = new Date(order.created_at)
    const formattedDate = dateObj.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border">

                {/* Modal Header */}
                <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-white/20 p-2 rounded-full">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">¡Comprobante Generado!</h2>
                            <p className="text-primary-foreground/80 text-sm">Vista previa de boleta de venta electrónica</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 opacity-10 blur-xl w-32 h-32 bg-white rounded-full -mr-10 -mt-10"></div>
                </div>

                {/* Modal Body - The Ticket */}
                <div className="p-6 overflow-y-auto flex-1 bg-secondary/5" id="printable-receipt">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-border/50 max-w-lg mx-auto relative font-sans text-foreground">

                        {/* Ticket Header & QR */}
                        <div className="flex justify-between items-start mb-8 pb-8 border-b border-dashed border-gray-300">
                            <div>
                                <h1 className="text-2xl font-black text-secondary tracking-tight">LA BAJADA</h1>
                                <p className="text-sm text-gray-500 mt-1">Av. Principal 123, Lima</p>
                                <p className="text-sm text-gray-500">Tel: (01) 234-5678</p>
                                <p className="text-sm text-gray-500">RUC: 20123456789</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="border-2 border-primary rounded-lg p-2 text-center mb-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Boleta de Venta</p>
                                    <p className="text-lg font-black text-primary">{receiptNumber}</p>
                                </div>
                                <div className="bg-white p-1 border border-gray-200 rounded">
                                    <QRCodeSVG value={`http://localhost:3000/receipt/${order.id}`} size={64} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Escanear para verificar</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                            <div>
                                <p className="text-gray-500 font-medium mb-1">Datos del Cliente:</p>
                                <p><strong>Nombre:</strong> {order.customer_name}</p>
                                <p><strong>Celular:</strong> {order.customer_phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 font-medium mb-1">Datos de Emisión:</p>
                                <p><strong>Fecha:</strong> {formattedDate}</p>
                                <p><strong>Cajero:</strong> Admin General</p>
                                <div className="mt-2 inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs">
                                    PAGADO
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-sm mb-6">
                            <thead>
                                <tr className="border-b-2 border-gray-200 text-gray-600">
                                    <th className="text-left font-semibold py-2">Producto</th>
                                    <th className="text-center font-semibold py-2">Cant.</th>
                                    <th className="text-right font-semibold py-2">P. Unit.</th>
                                    <th className="text-right font-semibold py-2">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const productName = Array.isArray(item.product) ? item.product[0]?.name : item.product?.name
                                    const unitPrice = item.subtotal / item.quantity

                                    return (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                                            <td className="py-3 text-gray-800">{productName || "Producto"}</td>
                                            <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                            <td className="py-3 text-right text-gray-600">S/ {unitPrice.toFixed(2)}</td>
                                            <td className="py-3 text-right font-medium text-gray-800">S/ {item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="border-t-2 border-gray-200 pt-4 flex flex-col items-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Op. Gravada:</span>
                                    <span>S/ {(order.order_total / 1.18).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>IGV (18%):</span>
                                    <span>S/ {(order.order_total - (order.order_total / 1.18)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2 mt-2 border-t border-gray-100">
                                    <span className="font-bold text-gray-800 uppercase tracking-widest text-sm">Total a Pagar:</span>
                                    <span className="text-xl font-bold text-primary">S/ {order.order_total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-12 text-xs text-gray-400">
                            <p>Representación impresa de la Boleta de Venta Electrónica.</p>
                            <p>¡Gracias por su preferencia!</p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="bg-surface border-t border-border p-4 flex justify-between items-center gap-4">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        <Button variant="outline" className="gap-2 shrink-0 border-primary text-primary hover:bg-primary/5" onClick={onPrint}>
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </Button>
                        <Button variant="outline" className="gap-2 shrink-0 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5" onClick={onSendWhatsApp}>
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </Button>
                    </div>
                    <Button variant="secondary" onClick={onClose} className="shrink-0 bg-background hover:bg-secondary/10 text-foreground border border-border">
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}
