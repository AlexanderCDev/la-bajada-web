"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Product } from "@/store"

export default function MenuManagement() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_available: true
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        const [prodsRes, catsRes] = await Promise.all([
            supabase.from("products").select("*").order("created_at", { ascending: false }),
            supabase.from("categories").select("*").order("name")
        ])

        if (prodsRes.data) setProducts(prodsRes.data)
        if (catsRes.data) setCategories(catsRes.data)
        setIsLoading(false)
    }

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingId(product.id)
            setFormData({
                name: product.name,
                description: product.description || "",
                price: product.price.toString(),
                category_id: product.category_id || "",
                image_url: product.image_url || "",
                is_available: product.is_available
            })
        } else {
            setEditingId(null)
            setFormData({
                name: "",
                description: "",
                price: "",
                category_id: categories.length > 0 ? categories[0].id : "",
                image_url: "",
                is_available: true
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const data = {
                name: formData.name,
                description: formData.description,
                price: Number(formData.price),
                category_id: formData.category_id === "" ? null : formData.category_id,
                image_url: formData.image_url,
                is_available: formData.is_available
            }

            if (editingId) {
                const { error } = await supabase.from("products").update(data).eq("id", editingId)
                if (error) throw error
                toast.success("Producto actualizado")
            } else {
                const { error } = await supabase.from("products").insert([data])
                if (error) throw error
                toast.success("Producto creado")
            }

            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al guardar el producto")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return

        try {
            const { error } = await supabase.from("products").delete().eq("id", id)
            if (error) throw error
            toast.success("Producto eliminado")
            fetchData()
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar")
        }
    }

    // Handle simple image URL (for a full app we'd use supabase storage directly from client, but here we just take URL for simplicity or implement quick upload)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        toast.info("Subiendo imagen...")

        try {
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('products').getPublicUrl(filePath)

            setFormData({ ...formData, image_url: data.publicUrl })
            toast.success("Imagen subida")
        } catch (error: any) {
            toast.error("Error al subir imagen")
            console.error(error)
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestión de Menú</h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-border text-foreground/70">
                                <th className="p-4 font-medium">Producto</th>
                                <th className="p-4 font-medium">Categoría</th>
                                <th className="p-4 font-medium">Precio</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-secondary/10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-foreground/30" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-xs text-foreground/50 line-clamp-1 max-w-[200px]">{product.description}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {categories.find(c => c.id === product.category_id)?.name || "-"}
                                    </td>
                                    <td className="p-4 font-medium">
                                        S/ {product.price.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.is_available ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                            }`}>
                                            {product.is_available ? "Disponible" : "Agotado"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenModal(product)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="danger" size="icon" onClick={() => handleDelete(product.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-foreground/50">
                                        No hay productos todavía. Agrega uno usando el botón superior.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Producto" : "Nuevo Producto"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre *</label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Precio (S/) *</label>
                            <Input
                                type="number"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <select
                                className="flex w-full h-12 rounded-xl border border-border bg-transparent px-4 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">Ninguna</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                            Imagen
                            {formData.image_url && <span className="text-xs text-primary">Subida ✓</span>}
                        </label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="pt-2.5"
                        />
                        {formData.image_url && (
                            <div className="h-24 w-24 rounded-lg overflow-hidden border border-border mt-2">
                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_available"
                            className="w-4 h-4 text-primary rounded"
                            checked={formData.is_available}
                            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        />
                        <label htmlFor="is_available" className="text-sm font-medium cursor-pointer">
                            Producto Disponible
                        </label>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Guardando..." : "Guardar Producto"}
                    </Button>
                </form>
            </Modal>
        </div>
    )
}
