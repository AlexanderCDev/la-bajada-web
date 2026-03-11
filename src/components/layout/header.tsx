"use client"

import * as React from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useStore } from "@/store"
import { Button } from "@/components/ui/button"
import { CartDrawer } from "@/components/cart/cart-drawer"

export function Header() {
    const cart = useStore((state) => state.cart)
    const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0)
    const [isCartOpen, setIsCartOpen] = React.useState(false)

    return (
        <>
            <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface/80 border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-2xl text-primary flex items-center gap-2">
                        🥪 <span className="text-foreground">La Bajada</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 font-medium text-foreground/80">
                        <Link href="/menu" className="hover:text-primary transition-colors">Menú</Link>
                        <Link href="/#nosotros" className="hover:text-primary transition-colors">Nosotros</Link>
                        <Link href="/#ubicacion" className="hover:text-primary transition-colors">Ubicación</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/menu">
                            <Button variant="default" className="hidden md:inline-flex">
                                Pedir Ahora
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            aria-label="Carrito"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartItemsCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItemsCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </header>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    )
}
