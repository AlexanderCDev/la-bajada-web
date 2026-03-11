import Link from "next/link"
import { MapPin, Phone, Clock, Instagram, Facebook } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-primary">La Bajada</h3>
                    <p className="text-secondary-foreground/80 max-w-xs mb-6">
                        El sabor que te hace volver. Sánguches, hamburguesas y más con el auténtico estilo street food premium.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Facebook className="w-5 h-5" />
                        </a>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                    <ul className="space-y-4 text-secondary-foreground/80">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span>Av. Principal 123, Ciudad<br />Lima, Perú</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" />
                            <span>+51 987 654 321</span>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4">Horario de Atención</h3>
                    <ul className="space-y-4 text-secondary-foreground/80">
                        <li className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary shrink-0" />
                            <div>
                                <p>Lunes - Miércoles: 6pm - 12am</p>
                                <p>Jueves - Domingo: 6pm - 3am</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center text-secondary-foreground/60 text-sm">
                <p>&copy; {new Date().getFullYear()} La Bajada. Todos los derechos reservados.</p>
            </div>
        </footer>
    )
}
