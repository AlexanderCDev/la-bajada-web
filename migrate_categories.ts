import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crzuflxkudgwswneodwb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyenVmbHhrdWRnd3N3bmVvZHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDIwMTAsImV4cCI6MjA4ODMxODAxMH0.OV1jHyxB88WcHzpNoL5Mp49a0qpSTVhznf88VxaMrh0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log("Fetching existing categories...")
    const { data: existingCats } = await supabase.from('categories').select('*')

    const desiredCategories = [
        { name: "Hamburguesas", keywords: ["hamburguesa", "burger", "cheese", "royal", "angus", "parrillera"] },
        { name: "Salchipapas", keywords: ["salchipapa", "frankfurter", "chorizo", "mostrito", "salchiqueso", "salchipollo"] },
        { name: "Broaster", keywords: ["broaster", "alita", "pierna", "pecho"] },
        { name: "Tacos y Enchiladas", keywords: ["taco", "enchilada", "mexican"] },
        { name: "Bebidas", keywords: ["bebida", "gaseosa", "chicha", "agua", "jugo", "limonada", "inca", "coca", "sprite", "fanta", "guarana"] }
    ]

    const categoryMap = new Map()

    for (const dc of desiredCategories) {
        let cat = existingCats?.find(c => c.name.toLowerCase() === dc.name.toLowerCase())
        if (!cat) {
            console.log(`Creating category: ${dc.name}`)
            const { data, error } = await supabase.from('categories').insert([{ name: dc.name, description: '' }]).select().single()
            if (error) {
                console.error("Error creating category:", error)
                continue
            }
            cat = data
        }
        categoryMap.set(dc.name, { id: cat.id, keywords: dc.keywords })
    }

    console.log("Fetching products...")
    const { data: products } = await supabase.from('products').select('*')

    if (!products) return

    for (const p of products) {
        let matchedCategory = null
        const textToSearch = `${p.name} ${p.description || ""}`.toLowerCase()

        for (const [name, data] of Array.from(categoryMap.entries())) {
            if (data.keywords.some((k: string) => textToSearch.includes(k))) {
                matchedCategory = data.id
                break
            }
        }

        if (matchedCategory && p.category_id !== matchedCategory) {
            console.log(`Mapping "${p.name}" to category ID ${matchedCategory}`)
            await supabase.from('products').update({ category_id: matchedCategory }).eq('id', p.id)
        }
    }

    // Borrar categorias que no estén en las deseadas
    const desiredNames = desiredCategories.map(c => c.name.toLowerCase())
    if (existingCats) {
        for (const ec of existingCats) {
            if (!desiredNames.includes(ec.name.toLowerCase())) {
                console.log(`Deleting unused category: ${ec.name}`)
                await supabase.from('categories').delete().eq('id', ec.id)
            }
        }
    }

    console.log("Done!")
}

main()
