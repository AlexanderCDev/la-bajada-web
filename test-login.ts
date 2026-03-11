import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
    console.log("Attempting login...")
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@labajada.com',
        password: 'admin123',
    })

    if (error) {
        console.error("LOGIN ERROR:", error)
    } else {
        console.log("LOGIN SUCCESS:", data.user?.id)
    }
}

testLogin()
