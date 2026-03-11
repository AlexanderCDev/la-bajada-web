"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock, Star, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useStore, Product } from "@/store"
import { toast } from "sonner"

export default function Home() {
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [isLoadingStars, setIsLoadingStars] = useState(true)
  const addToCart = useStore((state) => state.addToCart)

  useEffect(() => {
    async function fetchTopProducts() {
      try {
        // Fetch 3 top products (can be by sales, here we'll just pick 3 featured ones or highest price for visual demo if no explicit 'is_featured' flag exists)
        const { data, error } = await supabase
          .from("products")
          .select("*, category:categories(name)")
          .eq("is_available", true)
          .limit(3)

        if (error) throw error
        setTopProducts(data || [])
      } catch (err) {
        console.error("Error fetching top products:", err)
      } finally {
        setIsLoadingStars(false)
      }
    }
    fetchTopProducts()
  }, [])

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    toast.success(`${product.name} agregado al carrito`)
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Background pattern/image placeholder since we don't have an asset yet. Using a cool gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/40 z-10" />
            <img
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2000&auto=format&fit=crop"
              alt="Hambuguesa deliciosa"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="container relative z-20 px-4 text-center flex flex-col items-center">


            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-2xl tracking-tight"
            >
              El sabor que te<br /><span className="text-primary">hace volver.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-lg font-medium"
            >
              Sánguches clásicos, hamburguesas jugosas y mucho más. Pide ahora y recibe tu pedido o recógelo en tienda.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/menu">
                <Button size="lg" className="w-full sm:w-auto text-lg px-12 h-16 rounded-full shadow-2xl hover:scale-105 transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  Ver Nuestro Menú <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Decorative wave at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <svg viewBox="0 0 1440 120" className="w-full h-auto text-background fill-current">
              <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="py-24 bg-surface px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="container mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-secondary mb-4 tracking-tight">Nuestras Especialidades</h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: "Sánguches Clásicos", emoji: "🥪", desc: "Los de siempre, preparados al instante con nuestro toque especial 100% casero." },
                { name: "Hamburguesas Premium", emoji: "🍔", desc: "Jugosas, generosas y con harto sabor que te dejará pidiendo más." },
                { name: "Salchipapas y más", emoji: "🍟", desc: "Para compartir (o comértelo todo). Crujientes y rebalsantes de sabor." }
              ].map((cat, i) => (
                <motion.div
                  variants={fadeInUp}
                  key={i}
                  className="bg-background rounded-[2rem] p-10 text-center shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border group cursor-pointer"
                >
                  <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30">
                    {cat.emoji}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{cat.name}</h3>
                  <p className="text-foreground/70 mb-8 leading-relaxed text-lg">{cat.desc}</p>
                  <Link href="/menu" className="inline-flex items-center text-primary font-bold hover:underline group-hover:text-primary transition-colors text-lg">
                    Ver opciones <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Promociones Especiales */}
        <section className="py-24 bg-primary/5 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="text-center mb-16">
                <div className="inline-flex items-center gap-2 text-primary font-bold mb-3 uppercase tracking-wider text-sm bg-primary/10 px-4 py-2 rounded-full">
                  <span className="animate-pulse">🔥</span> Ofertas Imperdibles
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-secondary mb-4 tracking-tight">Promociones Especiales</h2>
                <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
                <p className="text-lg text-foreground/70 mt-6 max-w-2xl mx-auto">Aprovecha nuestros combos y descuentos diseñados para calmar tu bajada al mejor precio.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Promo 1 */}
                <motion.div variants={fadeInUp} className="relative rounded-[2.5rem] overflow-hidden shadow-xl group h-[400px]">
                  <img src="/images/promo-combo.png" alt="Combo hamburguesas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary text-primary-foreground font-black text-2xl w-fit px-4 py-2 rounded-lg transform -rotate-3 border-2 border-background shadow-lg">
                        -20% DSCTO
                      </div>
                      <div className="bg-background text-foreground font-black text-2xl px-4 py-2 rounded-lg transform rotate-3 border-2 border-primary shadow-lg">
                        S/ 35.00
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">Combo Pareja</h3>
                    <p className="text-white/90 text-lg mb-6 max-w-md">2 Hamburguesas Clásicas + 2 Papas Fritas + 2 Bebidas. Ideal para compartir.</p>
                    <Button
                      onClick={() => handleAddToCart({
                        id: '00000000-0000-0000-0000-000000000001',
                        name: 'Combo Pareja (-20% DSCTO)',
                        description: '2 Hamburguesas Clásicas + 2 Papas Fritas + 2 Bebidas.',
                        price: 35.00,
                        image_url: '/images/promo-combo.png',
                        category_id: null,
                        is_available: true
                      })}
                      className="w-fit rounded-full bg-white text-secondary hover:bg-white/90 font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      Pedir Promo a S/ 35.00 <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>

                {/* Promo 2 */}
                <motion.div variants={fadeInUp} className="relative rounded-[2.5rem] overflow-hidden shadow-xl group h-[400px]">
                  <img src="/images/promo-salchipapa.png" alt="Salchipapa familiar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-secondary text-secondary-foreground font-black text-2xl w-fit px-4 py-2 rounded-lg transform rotate-2 border-2 border-background shadow-lg">
                        ¡NUEVO!
                      </div>
                      <div className="bg-background text-foreground font-black text-2xl px-4 py-2 rounded-lg transform -rotate-2 border-2 border-secondary shadow-lg">
                        S/ 28.00
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">Salchipapa Extrema</h3>
                    <p className="text-white/90 text-lg mb-6 max-w-md">Nuestra famosa salchipapa ahora en tamaño monstruoso con todas las cremas.</p>
                    <Button
                      onClick={() => handleAddToCart({
                        id: '00000000-0000-0000-0000-000000000002',
                        name: 'Salchipapa Extrema',
                        description: 'Nuestra famosa salchipapa ahora en tamaño monstruoso con todas las cremas.',
                        price: 28.00,
                        image_url: '/images/promo-salchipapa.png',
                        category_id: null,
                        is_available: true
                      })}
                      className="w-fit rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      Probar Ahora a S/ 28.00 <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dynamic Highlight Section: Los Favoritos */}
        <section className="py-24 bg-background px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold mb-3 uppercase tracking-wider text-sm">
                    <Star fill="currentColor" className="w-5 h-5" /> Exquisitamente Seleccionados
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-secondary tracking-tight">Los Favoritos del Público</h2>
                </div>
                <Link href="/menu">
                  <Button variant="outline" className="rounded-full border-2 hover:bg-secondary hover:text-secondary-foreground transition-colors font-semibold">
                    Ver Todo el Menú
                  </Button>
                </Link>
              </motion.div>

              {!isLoadingStars && topProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {topProducts.map((product) => (
                    <motion.div
                      variants={fadeInUp}
                      key={product.id}
                      className="bg-surface rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-secondary/5 relative overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="text-6xl group-hover:scale-110 transition-transform duration-500">🥪</div>
                        )}
                        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-border/50">
                          ⭐ Más Vendido
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-foreground/60 text-sm line-clamp-2 mb-6 flex-1">
                          {product.description || "Delicioso y preparado al instante con los mejores ingredientes."}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-2xl font-black text-secondary">S/ {product.price.toFixed(2)}</span>
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="rounded-full shadow-lg hover:shadow-primary/25 transition-all"
                          >
                            Pedir Ahora
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Info Section (Map & Hours) */}
        <section id="ubicacion" className="py-24 bg-surface px-4 border-t border-border overflow-hidden">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="container mx-auto max-w-6xl"
          >
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <motion.div variants={fadeInUp} className="w-full lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-black text-secondary mb-8 tracking-tight">Ven a disfrutar en persona</h2>
                <p className="text-lg text-foreground/70 mb-10 leading-relaxed">
                  Vive la experiencia completa en nuestro local. El mejor ambiente para compartir la mejor comida con tus amigos y familia.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-5 p-8 bg-background rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-secondary">Ubicación Central</h3>
                      <p className="text-foreground/70 text-lg leading-relaxed">Av. Principal 123, Ciudad<br />Lima, Perú</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5 p-8 bg-background rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div className="w-full">
                      <h3 className="text-xl font-bold mb-4 text-secondary">Horarios de Atención</h3>
                      <div className="text-foreground/70 space-y-3 text-lg w-full">
                        <div className="flex justify-between items-center border-b border-border/50 pb-2">
                          <span>Lun - Mié:</span>
                          <span className="font-bold text-secondary">6:00 PM <span className="opacity-50 font-normal mx-1">-</span> 12:00 AM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Jue - Dom:</span>
                          <span className="font-bold text-secondary">6:00 PM <span className="opacity-50 font-normal mx-1">-</span> 03:00 AM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, x: 40 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                }}
                className="w-full lg:w-1/2 h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-background bg-secondary/10 relative"
              >
                {/* Embedded google maps placeholder */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.7619373979144!2d-77.03153592500854!3d-12.059239891458853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c8c728e20f1b%3A0xc3b839ea7a5c7f8a!2sLima%2C%20Peru!5e0!3m2!1sen!2sus!4v1709590000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div >
  )
}
