/**
 * Verify Admin User Script
 * 
 * This script verifies that an admin user exists and has the correct role.
 * 
 * Usage:
 *   npx tsx scripts/verify-admin-user.ts <email>
 * 
 * Example:
 *   npx tsx scripts/verify-admin-user.ts admin@test.com
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ============================================================================
// Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a properly typed Supabase client for admin operations
 */
function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// Main Script
// ============================================================================

async function verifyAdminUser() {
  console.log('🔍 Admin User Verification Utility\n')

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  // Get email from command line argument
  const email = process.argv[2]

  if (!email) {
    console.error('❌ No email provided!')
    console.error('\nUsage:')
    console.error('  npx tsx scripts/verify-admin-user.ts <email>')
    console.error('\nExample:')
    console.error('  npx tsx scripts/verify-admin-user.ts admin@test.com')
    process.exit(1)
  }

  console.log(`📧 Checking email: ${email}\n`)

  try {
    // Create Supabase client with service role key
    const supabase: SupabaseClient<Database> = createAdminClient()

    // Step 1: Check if user exists in auth.users
    console.log('1️⃣  Checking auth.users table...')
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
      process.exit(1)
    }

    const authUser = users.find(u => u.email === email)

    if (!authUser) {
      console.log(`❌ User ${email} not found in auth.users`)
      console.log('\nThe user needs to sign up first or be created using:')
      console.log(`  npx tsx scripts/create-admin-with-password.ts ${email} YourPassword123!`)
      process.exit(1)
    }

    console.log(`✅ User found in auth.users`)
    console.log(`   ID: ${authUser.id}`)
    console.log(`   Email: ${authUser.email}`)
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Created: ${new Date(authUser.created_at).toLocaleString()}`)

    // Step 2: Check if user profile exists
    console.log('\n2️⃣  Checking user_profiles table...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single<Database['public']['Tables']['user_profiles']['Row']>()

    if (profileError || !profile) {
      if (profileError?.code === 'PGRST116') {
        console.log(`❌ Profile not found in user_profiles table`)
        console.log('\nCreate profile using:')
        console.log(`  npx tsx scripts/create-admin-user.ts ${email}`)
      } else {
        console.error('❌ Error fetching profile:', profileError?.message || 'No data returned')
      }
      process.exit(1)
    }

    console.log(`✅ Profile found in user_profiles`)
    console.log(`   ID: ${profile.id}`)
    console.log(`   Email: ${profile.email}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   Language: ${profile.language}`)
    console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`)

    // Step 3: Verify admin role
    console.log('\n3️⃣  Verifying admin access...')
    
    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
    
    if (!isAdmin) {
      console.log(`❌ User does not have admin role (current role: ${profile.role})`)
      console.log('\nPromote to admin using:')
      console.log(`  npx tsx scripts/create-admin-user.ts ${email}`)
      process.exit(1)
    }

    console.log(`✅ User has admin privileges (role: ${profile.role})`)

    // Summary
    console.log('\n✨ Verification Summary:')
    console.log('   ✅ User exists in auth system')
    console.log('   ✅ Profile exists in database')
    console.log('   ✅ Has admin role')
    console.log('\n🔐 User can access admin dashboard at:')
    console.log('   http://localhost:3000/admin')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

// ============================================================================
// Run Script
// ============================================================================

verifyAdminUser()
