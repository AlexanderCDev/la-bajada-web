import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // anon for sign up

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUser() {
    console.log("Attempting to create user...")
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@labajada.com',
        password: 'admin123',
    })

    if (error) {
        console.error("SIGNUP ERROR:", error)
    } else {
        console.log("SIGNUP SUCCESS:", data.user?.id)
    }
}

createUser()
