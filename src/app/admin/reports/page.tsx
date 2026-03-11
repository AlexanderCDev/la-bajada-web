"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Calendar as CalendarIcon, FileSpreadsheet, FileText, PieChart as PieChartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ['#F7C45F', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#d946ef', '#f97316']

type Order = {
    id: string
    order_total: number
    status: string
    created_at: string
}

type OrderItem = {
    quantity: number
    subtotal: number
    product: {
        id: string
        name: string
        image_url: string | null
        category: {
            name: string
        } | null
    }
}

type DateFilter = "today" | "week" | "month" | "all"

const FILTER_NAMES: Record<DateFilter, string> = {
    today: "Hoy",
    week: "Últimos 7 días",
    month: "Últimos 30 días",
    all: "Histórico"
}

export default function ReportsPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [orderItems, setOrderItems] = useState<OrderItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState<DateFilter>("today")

    useEffect(() => {
        fetchData(dateFilter)
    }, [dateFilter])

    const fetchData = async (filter: DateFilter) => {
        setIsLoading(true)
        try {
            let startDate = new Date()
            if (filter === "today") {
                startDate.setHours(0, 0, 0, 0)
            } else if (filter === "week") {
                startDate.setDate(startDate.getDate() - 7)
            } else if (filter === "month") {
                startDate.setMonth(startDate.getMonth() - 1)
            } else {
                startDate = new Date(2000, 0, 1) // All time roughly
            }

            // Fetch Orders Completed or anything not Cancelled. Since we don't have cancelled status defined clearly, let's just grab all or Completado. Let's assume all orders matter or Completed ones.
            // Using all orders for now to show data.
            const { data: oData, error: oError } = await supabase
                .from("orders")
                .select("id, order_total, status, created_at")
                .gte("created_at", startDate.toISOString())

            if (oError) throw oError

            const validOrders = oData || []
            setOrders(validOrders)

            // Fetch Top Products
            const orderIds = validOrders.map(o => o.id)
            if (orderIds.length > 0) {
                const { data: iData, error: iError } = await supabase
                    .from("order_items")
                    .select(`
                        quantity, 
                        subtotal, 
                        product:products(id, name, image_url, category:categories(name))
                    `)
                    .in("order_id", orderIds)

                if (iError) throw iError
                // Note: The product join might return an array if not configured correctly, but normally it's an object. 
                // We'll cast it to `any` safely in the reduce phase just in case.
                setOrderItems(iData as any || [])
            } else {
                setOrderItems([])
            }

        } catch (error) {
            console.error("Error fetching report data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculations
    const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.order_total, 0), [orders])
    const totalOrdersCount = orders.length
    const averageTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

    // Top Products Calculation
    const topProducts = useMemo(() => {
        const productMap = new Map<string, { name: string, image_url: string | null, total_quantity: number, total_revenue: number }>()

        orderItems.forEach(item => {
            // handle Supabase returning arrays for relations sometimes
            const prod = Array.isArray(item.product) ? item.product[0] : item.product
            if (!prod) return

            const existing = productMap.get(prod.id) || { name: prod.name, image_url: prod.image_url, total_quantity: 0, total_revenue: 0 }
            existing.total_quantity += item.quantity
            existing.total_revenue += item.subtotal
            productMap.set(prod.id, existing)
        })

        return Array.from(productMap.values()).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10) // Top 10
    }, [orderItems])

    // Category Sales Calculation
    const categorySales = useMemo(() => {
        const catMap = new Map<string, number>()

        orderItems.forEach(item => {
            const prod = Array.isArray(item.product) ? item.product[0] : item.product
            if (!prod) return

            let catName = "Sin Categoría"
            if (prod.category) {
                // handle supersonic nested relations
                const catInfo = Array.isArray(prod.category) ? prod.category[0] : prod.category
                if (catInfo && catInfo.name) {
                    catName = catInfo.name
                }
            }

            const currentTotal = catMap.get(catName) || 0
            catMap.set(catName, currentTotal + item.subtotal)
        })

        return Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    }, [orderItems])

    // Demand by Day Calculation
    const demandByDay = useMemo(() => {
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const dayMap = new Map<string, { total_revenue: number, orders_count: number }>();

        dayNames.forEach(d => dayMap.set(d, { total_revenue: 0, orders_count: 0 }));

        orders.forEach(order => {
            const date = new Date(order.created_at);
            const dayName = dayNames[date.getDay()];
            const existing = dayMap.get(dayName)!;
            existing.total_revenue += order.order_total;
            existing.orders_count += 1;
        });

        // We want to return them in chronological order or sorted? 
        // A bar chart usually looks better sorted by day of week or by value.
        // Let's sort by value from highest to lowest to show "Top Days"
        return Array.from(dayMap.entries())
            .map(([name, data]) => ({ name, value: data.total_revenue, orders: data.orders_count }))
            .sort((a, b) => b.value - a.value)
            .filter(d => d.orders > 0); // Only show days that actually have orders
    }, [orders])

    const handleExportExcel = async () => {
        if (orders.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventas');

        // Global settings
        worksheet.views = [{ showGridLines: false }];

        // Header Title
        worksheet.mergeCells('A1:E2');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Reporte de Ventas - La Bajada`;
        titleCell.font = { name: 'Segoe UI', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // slate-900
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Subtitle / Filter
        worksheet.mergeCells('A3:E3');
        const subtitleCell = worksheet.getCell('A3');
        const filterNameEsp = FILTER_NAMES[dateFilter];
        subtitleCell.value = `Filtro aplicado: ${filterNameEsp.toUpperCase()} | Fecha de Exportación: ${new Date().toLocaleDateString("es-PE")}`;
        subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } }; // slate-600
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Summary Cards Section
        const drawSummaryCard = (cellRef: string, title: string, value: string | number, isCurrency: boolean = false) => {
            const cell = worksheet.getCell(cellRef);
            cell.value = title;
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF64748B' } };
            cell.alignment = { vertical: 'bottom', horizontal: 'center' };

            // Note: exceljs doesn't easily let us put two cells vertically merged for value next to title without messing grid.
            // Let's use two rows.
        };

        // Let's build a nice 3-column summary in row 5 & 6
        worksheet.getCell('B5').value = 'ÓRDENES TOTALES';
        worksheet.getCell('B5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF64748B' } };
        worksheet.getCell('B5').alignment = { horizontal: 'center' };
        worksheet.getCell('B6').value = totalOrdersCount;
        worksheet.getCell('B6').font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF2563EB' } }; // blue-600
        worksheet.getCell('B6').alignment = { horizontal: 'center' };
        worksheet.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        worksheet.getCell('B6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        worksheet.getCell('C5').value = 'INGRESOS TOTALES';
        worksheet.getCell('C5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF64748B' } };
        worksheet.getCell('C5').alignment = { horizontal: 'center' };
        worksheet.getCell('C6').value = totalRevenue;
        worksheet.getCell('C6').numFmt = '"S/"#,##0.00';
        worksheet.getCell('C6').font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF059669' } }; // emerald-600
        worksheet.getCell('C6').alignment = { horizontal: 'center' };
        worksheet.getCell('C5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        worksheet.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        worksheet.getCell('D5').value = 'TICKET PROMEDIO';
        worksheet.getCell('D5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF64748B' } };
        worksheet.getCell('D5').alignment = { horizontal: 'center' };
        worksheet.getCell('D6').value = averageTicket;
        worksheet.getCell('D6').numFmt = '"S/"#,##0.00';
        worksheet.getCell('D6').font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF7C3AED' } }; // violet-600
        worksheet.getCell('D6').alignment = { horizontal: 'center' };
        worksheet.getCell('D5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        worksheet.getCell('D6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        // Table Header
        const headerRowIndex = 9;
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.values = ['#', 'ID de Orden', 'Fecha', 'Estado', 'Total'];
        headerRow.height = 25;

        worksheet.columns = [
            { key: 'index', width: 6 },
            { key: 'id', width: 38 },
            { key: 'fecha', width: 15 },
            { key: 'estado', width: 18 },
            { key: 'total', width: 18 },
        ];

        headerRow.eachCell((cell) => {
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // indigo-600
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                bottom: { style: 'medium', color: { argb: 'FF312E81' } }
            };
        });

        // Add Data with native types
        orders.forEach((order, idx) => {
            const rowIndex = headerRowIndex + 1 + idx;
            const row = worksheet.insertRow(rowIndex, {
                index: idx + 1,
                id: order.id,
                fecha: new Date(order.created_at),
                estado: order.status.toUpperCase(),
                total: order.order_total
            });

            row.height = 20;

            // Zebra banding
            const isEven = idx % 2 === 0;
            const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // slate-50

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.alignment = { vertical: 'middle' };
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'hair', color: { argb: 'FFE2E8F0' } }
                };

                // Specific alignments/formats
                if (colNumber === 1 || colNumber === 4) cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (colNumber === 3) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.numFmt = 'dd/mm/yyyy';
                }
                if (colNumber === 5) {
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = '"S/"#,##0.00';
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                }
            });
        });

        // Footer Row for Totals sum
        const lastRowIndex = headerRowIndex + orders.length + 1;
        const footerRow = worksheet.getRow(lastRowIndex);
        worksheet.mergeCells(`A${lastRowIndex}:D${lastRowIndex}`);
        const totalTextCell = footerRow.getCell(1);
        totalTextCell.value = 'TOTAL GENERAL';
        totalTextCell.alignment = { vertical: 'middle', horizontal: 'right' };
        totalTextCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };

        const sumCell = footerRow.getCell(5);
        // Excel formula for sum
        sumCell.value = { formula: `SUM(E${headerRowIndex + 1}:E${lastRowIndex - 1})` };
        sumCell.numFmt = '"S/"#,##0.00';
        sumCell.alignment = { vertical: 'middle', horizontal: 'right' };
        sumCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF059669' } };

        footerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
            cell.border = {
                top: { style: 'medium', color: { argb: 'FFCBD5E1' } },
                bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } }
            };
        });
        footerRow.height = 25;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Reporte_Ventas_${filterNameEsp.replace(/ /g, "_").toLowerCase()}.xlsx`);
    }

    const handleExportPDF = () => {
        if (orders.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Colors
        const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
        const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600
        const successColor: [number, number, number] = [16, 185, 129]; // emerald-500

        // Helper to center text
        const centerText = (text: string, y: number, size: number, style = 'normal', color = [0, 0, 0]) => {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            doc.setTextColor(color[0], color[1], color[2]);
            const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
            doc.text(text, (pageWidth - textWidth) / 2, y);
        };

        // --- Header Background ---
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // --- Header Text ---
        centerText("REPORTE DE VENTAS", 20, 22, 'bold', [255, 255, 255]);
        centerText("L a   B a j a d a", 28, 12, 'normal', [200, 200, 200]);

        // Export Meta
        const filterNameEsp = FILTER_NAMES[dateFilter];
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(255, 255, 255);
        doc.text(`Filtro: ${filterNameEsp.toUpperCase()}`, 14, 40);
        doc.text(`Fecha Exp: ${new Date().toLocaleDateString("es-PE")}`, pageWidth - 14 - doc.getTextWidth(`Fecha Exp: ${new Date().toLocaleDateString("es-PE")}`), 40);

        // --- KPI Summary Cards (Simulated) ---
        let startY = 55;

        // Card 1
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, startY, 55, 25, 3, 3, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("ÓRDENES", 19, startY + 8);
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235); // blue
        doc.text(`${totalOrdersCount}`, 19, startY + 18);

        // Card 2
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(77, startY, 55, 25, 3, 3, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("INGRESOS", 82, startY + 8);
        doc.setFontSize(16);
        doc.setTextColor(successColor[0], successColor[1], successColor[2]); // emerald
        doc.text(`S/ ${totalRevenue.toFixed(2)}`, 82, startY + 18);

        // Card 3
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(140, startY, 56, 25, 3, 3, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("TICKET PROM.", 145, startY + 8);
        doc.setFontSize(16);
        doc.setTextColor(124, 58, 237); // violet
        doc.text(`S/ ${averageTicket.toFixed(2)}`, 145, startY + 18);

        let currentY = 95;

        // --- Top Products Table ---
        if (topProducts.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("Ranking de Productos", 14, currentY);
            currentY += 5;

            const tableData = topProducts.map((p, index) => [
                index + 1,
                p.name,
                p.total_quantity,
                `S/ ${p.total_revenue.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Producto', 'Unidades', 'Ingresos']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: accentColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
                },
                styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 15;
        }

        // --- Category Sales Table ---
        if (categorySales.length > 0) {
            // Check if we need to add a page
            if (currentY > pageHeight - 60) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text("Ingresos por Categoría", 14, currentY);
            currentY += 5;

            const categoryData = categorySales.map((c, index) => [
                index + 1,
                c.name,
                `S/ ${c.value.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Categoría', 'Ingresos']],
                body: categoryData,
                theme: 'grid',
                headStyles: {
                    fillColor: successColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    2: { halign: 'right', fontStyle: 'bold' }
                },
                styles: { font: 'helvetica', fontSize: 10, cellPadding: 5, lineColor: [226, 232, 240] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });
        }

        // --- Global Footer (All pages) ---
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`Generado automáticamente desde La Bajada Dashboard`, 14, pageHeight - 8);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14 - doc.getTextWidth(`Página ${i} de ${pageCount}`), pageHeight - 8);
        }

        doc.save(`Reporte_Ventas_${filterNameEsp.replace(/ /g, "_").toLowerCase()}.pdf`);
    }

    return (
        <div className="p-8 h-[calc(100vh)] overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-bold">Reportes de Ventas</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isLoading || orders.length === 0} className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || orders.length === 0} className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-600" /> PDF
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap bg-surface p-1 rounded-xl border border-border gap-1">
                    <Button
                        variant={dateFilter === "today" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDateFilter("today")}
                        className="rounded-lg"
                    >
                        Hoy
                    </Button>
                    <Button
                        variant={dateFilter === "week" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDateFilter("week")}
                        className="rounded-lg"
                    >
                        Últimos 7 días
                    </Button>
                    <Button
                        variant={dateFilter === "month" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDateFilter("month")}
                        className="rounded-lg"
                    >
                        Últimos 30 días
                    </Button>
                    <Button
                        variant={dateFilter === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDateFilter("all")}
                        className="rounded-lg"
                    >
                        Histórico
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-foreground/60 font-medium mb-1">Ingresos Totales</p>
                                        <h3 className="text-3xl font-bold text-primary">S/ {totalRevenue.toFixed(2)}</h3>
                                    </div>
                                    <div className="p-3 bg-primary/20 text-primary rounded-xl">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-foreground/60 font-medium mb-1">Órdenes Totales</p>
                                        <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-500">{totalOrdersCount}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-500/20 text-blue-600 dark:text-blue-500 rounded-xl">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-foreground/60 font-medium mb-1">Ticket Promedio</p>
                                        <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">S/ {averageTicket.toFixed(2)}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-xl">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Top Products */}
                        <Card className="lg:col-span-2 border-border shadow-sm">
                            <CardHeader className="border-b border-border bg-surface/50">
                                <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {topProducts.length === 0 ? (
                                    <div className="p-8 text-center text-foreground/50">No hay ventas registradas en este periodo.</div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {topProducts.map((prod, index) => (
                                            <div key={index} className="flex items-center gap-4 p-4 hover:bg-secondary/5 transition-colors">
                                                <div className="w-8 font-bold text-foreground/40 text-center">#{index + 1}</div>
                                                <div className="w-12 h-12 bg-secondary/10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                                    {prod.image_url ? (
                                                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl">🥪</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{prod.name}</p>
                                                    <p className="text-sm text-foreground/50">{prod.total_quantity} unidades vendidas</p>
                                                </div>
                                                <div className="text-right font-medium text-primary">
                                                    S/ {prod.total_revenue.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Category Sales Chart */}
                        <Card className="shadow-sm border-border h-fit">
                            <CardHeader className="border-b border-border bg-surface/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-primary" />
                                    Ventas por Categoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {categorySales.length === 0 ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-foreground/50 text-center">No hay datos de categorías.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categorySales}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        animationDuration={1500}
                                                    >
                                                        {categorySales.map((entry, index) => (
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
                                                        formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
                                                        itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-full mt-4 space-y-2 px-2 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                                            {categorySales.map((cat, index) => (
                                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 border border-border/50 px-2 py-1 bg-secondary/5 rounded-md flex-1">
                                                        <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <span className="font-semibold text-foreground/80 truncate">{cat.name}</span>
                                                    </div>
                                                    <span className="font-black ml-4 shrink-0 bg-primary/10 text-primary px-2 py-1 rounded-md">
                                                        S/ {cat.value.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional insights card - for future charts but right now just simple info */}
                        {/* Demand by Day Chart */}
                        <Card className="shadow-sm border-border h-fit">
                            <CardHeader className="border-b border-border bg-surface/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                    Días con Mayor Demanda
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {demandByDay.length === 0 ? (
                                    <div className="h-[250px] flex items-center justify-center">
                                        <p className="text-foreground/50 text-center">No hay suficientes datos para analizar la demanda.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={demandByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'var(--foreground)', opacity: 0.6, fontSize: 12 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: 'var(--foreground)', opacity: 0.6, fontSize: 12 }}
                                                        tickFormatter={(value) => `S/${value}`}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'var(--secondary)', opacity: 0.2 }}
                                                        contentStyle={{
                                                            backgroundColor: 'var(--surface)',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                        formatter={(value: any, name: any) => {
                                                            if (name === "value") return [`S/ ${Number(value).toFixed(2)}`, "Ingresos"];
                                                            if (name === "orders") return [value, "Órdenes"];
                                                            return [value, String(name)];
                                                        }}
                                                        labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold', marginBottom: '4px' }}
                                                    />
                                                    <Bar dataKey="value" name="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-full mt-4 border-t border-border pt-4">
                                            <h4 className="font-semibold text-foreground/80 mb-2 text-sm">Análisis Rápido</h4>
                                            <p className="text-foreground/70 text-sm leading-relaxed">
                                                El día con mayor movimiento es el <strong>{demandByDay[0].name}</strong>, acumulando S/ {demandByDay[0].value.toFixed(2)} en ingresos a lo largo de este periodo.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
