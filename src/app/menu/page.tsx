"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useStore, Product } from "@/store"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Category {
    id: string
    name: string
}

export default function MenuPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(true)

    const addToCart = useStore((state) => state.addToCart)

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            try {
                const [catsRes, prodsRes] = await Promise.all([
                    supabase.from("categories").select("*").order("name"),
                    supabase.from("products").select("*").eq("is_available", true)
                ])

                if (catsRes.error) throw catsRes.error
                if (prodsRes.error) throw prodsRes.error

                setCategories(catsRes.data || [])
                setProducts(prodsRes.data || [])
            } catch (error) {
                console.error("Error fetching data:", error)
                toast.error("Error cargando el menú")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
            (product.description?.toLowerCase().includes(search.toLowerCase()) ?? false)

        const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory

        return matchesSearch && matchesCategory
    })

    const handleAddToCart = (product: Product) => {
        addToCart(product)
        toast.success(`${product.name} agregado al carrito`)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            {/* Menu Header Area */}
            <div className="bg-secondary text-secondary-foreground py-12 px-4">
                <div className="container mx-auto max-w-6xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Nuestro Menú</h1>
                    <p className="text-secondary-foreground/80 max-w-2xl mx-auto mb-8">
                        Elige tus favoritos. Preparamos cada pedido al instante con los mejores ingredientes.
                    </p>

                    <div className="max-w-md mx-auto relative">
                        <Input
                            type="text"
                            placeholder="Buscar sánguche, bebida..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-surface text-foreground rounded-full pl-12 h-14 text-base"
                            icon={<Search className="w-5 h-5" />}
                        />
                    </div>
                </div>
            </div>

            <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
                {/* Category Filter */}
                <div className="flex overflow-x-auto pb-4 mb-8 gap-3 scrollbar-hide">
                    <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        className="rounded-full whitespace-nowrap"
                        onClick={() => setSelectedCategory("all")}
                    >
                        Todos
                    </Button>
                    {categories.map(category => (
                        <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            className="rounded-full whitespace-nowrap bg-surface"
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-surface border border-border rounded-2xl h-[320px]"></div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-2xl font-bold text-foreground/50">No encontramos productos</h3>
                        <p className="text-foreground/40 mt-2">Intenta buscar con otras palabras o selecciona otra categoría.</p>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map(product => (
                                <motion.div
                                    layout
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.9, y: 20 },
                                        visible: { opacity: 1, scale: 1, y: 0 }
                                    }}
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    key={product.id}
                                    className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group flex flex-col"
                                >
                                    <div className="aspect-[4/3] bg-secondary/5 relative overflow-hidden flex items-center justify-center">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                            />
                                        ) : (
                                            <div className="text-6xl group-hover:scale-110 transition-transform duration-500 ease-out flex items-center justify-center h-full w-full bg-secondary/5">🥪</div>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                        </div>

                                        <p className="text-foreground/60 text-sm line-clamp-2 mb-4 flex-1">
                                            {product.description || "Delicioso y preparado al instante."}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                                            <span className="text-xl font-black text-secondary">S/ {product.price.toFixed(2)}</span>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddToCart(product)}
                                                className="rounded-xl shadow-md hover:shadow-primary/25 transition-all font-semibold"
                                            >
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    )
}
