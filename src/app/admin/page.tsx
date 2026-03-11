"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, Utensils, CheckCircle, TrendingUp, Clock, Star } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts"

type OrderItem = {
    quantity: number
    subtotal: number
    product: {
        id: string
        name: string
    }
}

const COLORS = ['#F7C45F', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6']

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        todaySales: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalProducts: 0,
        averageTicket: 0
    })
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [hourlyData, setHourlyData] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Get bounds
                const now = new Date()
                const startOfDay = new Date(now)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(now)
                endOfDay.setHours(23, 59, 59, 999)

                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

                // 1. Fetch today's orders
                const { data: todayOrders } = await supabase
                    .from("orders")
                    .select("*")
                    .gte("created_at", startOfDay.toISOString())
                    .lte("created_at", endOfDay.toISOString())

                if (todayOrders) {
                    const sales = todayOrders.reduce((sum, order) => sum + Number(order.order_total), 0)
                    const active = todayOrders.filter(o => o.status !== "Completado" && o.status !== "Cancelado" && o.status !== "Pendiente").length
                    const completed = todayOrders.filter(o => o.status === "Completado").length
                    const avgTicket = completed > 0 ? (sales / completed) : 0

                    // Fetch total products
                    const { count: productsCount } = await supabase
                        .from("products")
                        .select("*", { count: 'exact', head: true })

                    setStats({
                        todaySales: sales,
                        activeOrders: active,
                        completedOrders: completed,
                        totalProducts: productsCount || 0,
                        averageTicket: avgTicket
                    })

                    // Process hourly data for today
                    const hoursArray = Array.from({ length: 24 }, (_, i) => ({
                        hourStr: `${i.toString().padStart(2, '0')}:00`,
                        total: 0
                    }))

                    todayOrders.forEach(order => {
                        if (order.status === "Completado") {
                            const dateObj = new Date(order.created_at)
                            const hr = dateObj.getHours()
                            hoursArray[hr].total += Number(order.order_total)
                        }
                    })

                    // Filter outside hours to not display a flat line for the whole day if we don't need to
                    // Or simply show all hours up to current hour
                    const currentHour = now.getHours()
                    setHourlyData(hoursArray.slice(0, currentHour + 1))
                }

                // 2. Fetch Top Products for the month
                const { data: monthOrders } = await supabase
                    .from("orders")
                    .select("id")
                    .gte("created_at", startOfMonth.toISOString())
                    .eq("status", "Completado")

                if (monthOrders && monthOrders.length > 0) {
                    const orderIds = monthOrders.map(o => o.id)
                    const { data: itemsData } = await supabase
                        .from("order_items")
                        .select(`
                            quantity, 
                            product:products(id, name)
                        `)
                        .in("order_id", orderIds)

                    if (itemsData) {
                        const productMap = new Map<string, { name: string, value: number }>()
                        itemsData.forEach((item: any) => {
                            const prod = Array.isArray(item.product) ? item.product[0] : item.product
                            if (!prod) return

                            const existing = productMap.get(prod.id) || { name: prod.name, value: 0 }
                            existing.value += item.quantity
                            productMap.set(prod.id, existing)
                        })

                        const sortedProducts = Array.from(productMap.values())
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 5) // Top 5

                        setTopProducts(sortedProducts)
                    }
                }

                // 3. Fetch most recent 50 orders (Historical) for the list
                const { data: allRecentOrders } = await supabase
                    .from("orders")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50)

                if (allRecentOrders) {
                    setRecentOrders(allRecentOrders)
                }

                // 4. Fetch data for the last 7 days chart
                const sevenDaysAgo = new Date(startOfDay)
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

                const { data: historicalOrders } = await supabase
                    .from("orders")
                    .select("*")
                    .gte("created_at", sevenDaysAgo.toISOString())
                    .lte("created_at", endOfDay.toISOString())

                if (historicalOrders) {
                    const last7Days: { dateStr: string; dayName: string; total: number }[] = []
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date()
                        d.setDate(d.getDate() - i)
                        last7Days.push({
                            dateStr: d.toISOString().split('T')[0],
                            dayName: d.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }),
                            total: 0
                        })
                    }

                    historicalOrders.forEach(order => {
                        if (order.status === "Completado") {
                            const dateStr = new Date(order.created_at).toISOString().split('T')[0]
                            const dayEntry = last7Days.find(d => d.dateStr === dateStr)
                            if (dayEntry) {
                                dayEntry.total += Number(order.order_total)
                            }
                        }
                    })

                    setChartData(last7Days)
                }

            } catch (error) {
                console.error("Error fetching dashboard stats:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="p-8 max-w-[1600px] mx-auto overflow-y-auto h-[calc(100vh)]">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard Principal</h1>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-primary/20 to-primary/5 hover:shadow-md transition-shadow border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-foreground/80">Ventas de Hoy</CardTitle>
                        <div className="p-2 bg-primary/20 rounded-full">
                            <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-primary">S/ {stats.todaySales.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 hover:shadow-md transition-shadow border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-foreground/80">Pedidos Activos</CardTitle>
                        <div className="p-2 bg-blue-500/20 rounded-full">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600">{stats.activeOrders}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 hover:shadow-md transition-shadow border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-foreground/80">Completados Hoy</CardTitle>
                        <div className="p-2 bg-green-500/20 rounded-full">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-600">{stats.completedOrders}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 hover:shadow-md transition-shadow border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-foreground/80">Ticket Promedio</CardTitle>
                        <div className="p-2 bg-purple-500/20 rounded-full">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-purple-600">S/ {stats.averageTicket.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* 7 Days Bar Chart */}
                <Card className="lg:col-span-2 shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 bg-surface">
                        <div>
                            <CardTitle className="text-lg">Resumen de Ventas</CardTitle>
                            <p className="text-sm text-foreground/60 mt-1">Últimos 7 días</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-foreground/40" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className="text-foreground/50 animate-pulse">Cargando gráfico...</p>
                            </div>
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis
                                            dataKey="dayName"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--foreground)', opacity: 0.7, fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--foreground)', opacity: 0.7, fontSize: 12 }}
                                            tickFormatter={(value) => `S/ ${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--border)' }}
                                            contentStyle={{
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
                                            labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="var(--primary)"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={50}
                                            animationDuration={1500}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products Donut Chart */}
                <Card className="shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 bg-surface">
                        <div>
                            <CardTitle className="text-lg">Productos Populares</CardTitle>
                            <p className="text-sm text-foreground/60 mt-1">Este Mes</p>
                        </div>
                        <Star className="w-5 h-5 text-foreground/40" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className="text-foreground/50 animate-pulse">Cargando gráfico...</p>
                            </div>
                        ) : topProducts.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className="text-foreground/50 text-center">No hay suficientes datos.</p>
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center">
                                <ResponsiveContainer width="100%" height="70%">
                                    <PieChart>
                                        <Pie
                                            data={topProducts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-2 space-y-2 px-2 overflow-y-auto max-h-[30%] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                    {topProducts.map((prod, index) => (
                                        <div key={prod.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span className="font-medium text-foreground/80 truncate max-w-[120px]">{prod.name}</span>
                                            </div>
                                            <span className="font-bold">{prod.value} und.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Hourly Sales Area Chart */}
                <Card className="lg:col-span-2 shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 bg-surface">
                        <div>
                            <CardTitle className="text-lg">Ventas por Hora</CardTitle>
                            <p className="text-sm text-foreground/60 mt-1">El día de hoy</p>
                        </div>
                        <Clock className="w-5 h-5 text-foreground/40" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <p className="text-foreground/50 animate-pulse">Cargando gráfico...</p>
                            </div>
                        ) : hourlyData.length === 0 ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <p className="text-foreground/50 text-center">No hay ventas registradas hoy.</p>
                            </div>
                        ) : (
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis
                                            dataKey="hourStr"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--foreground)', opacity: 0.7, fontSize: 12 }}
                                            dy={5}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'var(--foreground)', opacity: 0.7, fontSize: 12 }}
                                            tickFormatter={(value) => `S/ ${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
                                            labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorHour)" animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Orders List */}
                <Card className="shadow-sm flex flex-col h-[350px] border-border">
                    <CardHeader className="pb-4 shrink-0 border-b border-border/40 bg-surface">
                        <CardTitle className="text-lg">Últimos Pedidos</CardTitle>
                        <p className="text-sm text-foreground/60 mt-1">Historial reciente</p>
                    </CardHeader>
                    <CardContent className="overflow-y-auto pt-4 pr-2 flex-grow scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-foreground/50 py-4 text-center animate-pulse">Cargando historial...</p>
                            ) : recentOrders.length === 0 ? (
                                <p className="text-foreground/50 py-4 text-center">No hay pedidos recientes.</p>
                            ) : (
                                recentOrders.map(order => {
                                    const dateObj = new Date(order.created_at)
                                    const dateStr = dateObj.toLocaleDateString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

                                    // Determine status badge color
                                    let statusColor = "bg-primary/10 text-primary"
                                    if (order.status === "Completado") statusColor = "bg-green-500/10 text-green-600"
                                    if (order.status === "Cancelado") statusColor = "bg-red-500/10 text-red-600"
                                    if (order.status === "Preparando") statusColor = "bg-blue-500/10 text-blue-600"

                                    return (
                                        <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/5 hover:bg-secondary/10 transition-colors border border-border/50 rounded-xl">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="font-semibold text-sm truncate">{order.customer_name}</p>
                                                <p className="text-xs text-foreground/60 truncate">{dateStr} • {order.delivery_type}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm">S/ {Number(order.order_total).toFixed(2)}</p>
                                                <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold mt-1 uppercase tracking-wider ${statusColor}`}>
                                                    {order.status}
                                                </span>
                                                {order.payment_status === "success" && (
                                                    <span className="inline-flex items-center px-2 py-[2px] ml-2 rounded-full text-[10px] font-bold mt-1 uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                                                        💳 Pagado
                                                    </span>
                                                )}
                                                {order.payment_status === "pending" && (
                                                    <span className="inline-flex items-center px-2 py-[2px] ml-2 rounded-full text-[10px] font-bold mt-1 uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                                                        ⏳ Pago Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
