/**
 * Test Client Query Script
 *
 * This script tests if the client can query user_profiles using the anon key
 * (simulating what happens in the browser)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

async function testClientQuery() {
  console.log('🧪 Testing Client Query\n')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  try {
    // Create client with ANON key (like browser does)
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    console.log('1️⃣  Testing query without auth (should work if RLS disabled)...')

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Query failed:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
      console.error('   Hint:', error.hint)

      if (error.code === '42501') {
        console.log('\n💡 Error 42501 = Insufficient privilege')
        console.log('   This means RLS is likely still blocking the query')
        console.log('   In Supabase Dashboard:')
        console.log('   1. Go to Database > Tables > user_profiles')
        console.log('   2. Click "..." menu > "Edit Table"')
        console.log('   3. Ensure "Enable Row Level Security" is UNCHECKED')
      }
    } else {
      console.log('✅ Query succeeded!')
      console.log('   Rows returned:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Sample:', data[0])
      }
    }

    console.log('\n2️⃣  Testing with user session...')

    const email = process.argv[2] || 'admin@test.com'
    const password = process.argv[3]

    if (!password) {
      console.log('⚠️  No password provided, skipping session test')
      console.log('   Usage: npx tsx scripts/test-client-query.ts <email> <password>')
      return
    }

    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('❌ Sign in failed:', authError.message)
      return
    }

    console.log('✅ Signed in:', authData.user.email)

    // Try query with session
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile query failed:', profileError.message)
      console.error('   Code:', profileError.code)
    } else {
      console.log('✅ Profile query succeeded!')
      console.log('   Profile:', profileData)
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

testClientQuery()
