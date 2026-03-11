"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useStore } from "@/store"
import { Button } from "@/components/ui/button"

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useStore()

    React.useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden"
        else document.body.style.overflow = "unset"
        return () => { document.body.style.overflow = "unset" }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-surface shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Tu Pedido
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/10 transition-colors">
                                <X className="w-5 h-5 text-foreground/70" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50 space-y-4">
                                    <ShoppingBag className="w-16 h-16" />
                                    <p>Tu carrito está vacío</p>
                                    <Button variant="outline" onClick={onClose}>Ver el menú</Button>
                                </div>
                            ) : (
                                cart.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex gap-4 items-center bg-background p-3 rounded-2xl border border-border">
                                        <div className="w-16 h-16 bg-secondary/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-foreground/50">Sin img</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                                            <p className="text-primary font-bold text-sm">S/ {product.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button
                                                onClick={() => removeFromCart(product.id)}
                                                className="text-red-500 hover:text-red-600 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-2 bg-surface rounded-full border border-border px-2 py-1">
                                                <button
                                                    onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}
                                                    className="w-5 h-5 flex items-center justify-center hover:text-primary"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                                    className="w-5 h-5 flex items-center justify-center hover:text-primary"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-4 border-t border-border bg-surface">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-foreground/70 font-medium">Total</span>
                                    <span className="text-2xl font-bold">S/ {cartTotal().toFixed(2)}</span>
                                </div>
                                <Button className="w-full py-6 text-lg rounded-xl shadow-lg hover:shadow-primary/25" onClick={() => {
                                    window.location.href = '/checkout'
                                }}>
                                    Completar Pedido
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
