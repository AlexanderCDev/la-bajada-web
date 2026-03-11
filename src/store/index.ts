import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    category_id: string | null
    is_available: boolean
}

export interface CartItem {
    product: Product
    quantity: number
}

interface AppState {
    cart: CartItem[]
    addToCart: (product: Product, quantity?: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    cartTotal: () => number
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            cart: [],
            addToCart: (product, quantity = 1) => {
                set((state) => {
                    const existingItem = state.cart.find(item => item.product.id === product.id)
                    if (existingItem) {
                        return {
                            cart: state.cart.map(item =>
                                item.product.id === product.id
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        }
                    }
                    return { cart: [...state.cart, { product, quantity }] }
                })
            },
            removeFromCart: (productId) => {
                set((state) => ({
                    cart: state.cart.filter(item => item.product.id !== productId),
                }))
            },
            updateQuantity: (productId, quantity) => {
                set((state) => ({
                    cart: state.cart.map(item =>
                        item.product.id === productId ? { ...item, quantity } : item
                    ),
                }))
            },
            clearCart: () => set({ cart: [] }),
            cartTotal: () => {
                return get().cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
            },
        }),
        {
            name: 'la-bajada-storage',
        }
    )
)
