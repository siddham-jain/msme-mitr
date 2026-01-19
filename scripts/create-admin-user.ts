/**
 * Create Admin User Script
 * 
 * This script creates or updates a user with admin privileges.
 * It can be used to:
 * - Create a new admin user from environment variable
 * - Promote an existing user to admin role
 * 
 * Requirements: 3.1, 3.2, 3.4
 * 
 * Usage:
 *   # Create admin from environment variable
 *   npm run create-admin
 * 
 *   # Promote specific user to admin
 *   npm run create-admin -- user@example.com
 * 
 * Environment Variables:
 *   ADMIN_EMAIL - Default admin email (optional)
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SECRET_KEY - Secret key (required for admin operations)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserProfile, UserProfileInsert, UserProfileUpdate } from '@/types/database'

// ============================================================================
// Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!
const defaultAdminEmail = process.env.ADMIN_EMAIL

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

async function createAdminUser() {
  console.log('🔧 Admin User Setup Utility\n')

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('  - SUPABASE_SECRET_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  // Get email from command line argument or environment variable
  const email = process.argv[2] || defaultAdminEmail

  if (!email) {
    console.error('❌ No email provided!')
    console.error('\nUsage:')
    console.error('  npm run create-admin -- user@example.com')
    console.error('  OR set ADMIN_EMAIL in .env.local')
    process.exit(1)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error(`❌ Invalid email format: ${email}`)
    process.exit(1)
  }

  console.log(`📧 Target email: ${email}\n`)

  try {
    // Create Supabase client with service role key
    // Service role key bypasses RLS and allows admin operations
    const supabase: SupabaseClient<Database> = createAdminClient()

    // Step 1: Check if user exists in auth.users
    console.log('1️⃣  Checking if user exists in auth system...')

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
      process.exit(1)
    }

    const authUser = users.find(u => u.email === email)

    if (!authUser) {
      console.log(`⚠️  User ${email} not found in auth system`)
      console.log('\nThe user must first sign up through the application.')
      console.log('After they sign up, run this script again to promote them to admin.')
      process.exit(1)
    }

    console.log(`✅ User found: ${authUser.id}`)

    // Step 2: Check if user profile exists
    console.log('\n2️⃣  Checking user profile...')

    const profileQuery = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileQuery.error && profileQuery.error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if profile doesn't exist
      console.error('❌ Failed to fetch profile:', profileQuery.error.message)
      process.exit(1)
    }

    const profile = profileQuery.data as UserProfile | null

    if (!profile) {
      console.log('⚠️  Profile not found, creating...')

      // Create profile with admin role
      const newProfile: UserProfileInsert = {
        id: authUser.id,
        email: authUser.email!,
        role: 'admin',
        language: 'en',
        preferred_model: 'anthropic/claude-3-haiku'
      }

      // Type assertion needed: Supabase's generic type parameter doesn't always
      // propagate correctly through the query builder chain in script contexts
      const { error: insertError } = await (supabase
        .from('user_profiles') as any)
        .insert(newProfile)

      if (insertError) {
        console.error('❌ Failed to create profile:', insertError.message)
        process.exit(1)
      }

      console.log('✅ Profile created with admin role')
    } else {
      // Update existing profile to admin role
      console.log(`📋 Current role: ${profile.role}`)

      if (profile.role === 'admin' || profile.role === 'super_admin') {
        console.log('✅ User already has admin privileges')
        console.log('\n✨ No changes needed!')
        return
      }

      console.log('\n3️⃣  Updating role to admin...')

      const updateData: UserProfileUpdate = {
        role: 'admin'
      }

      // Type assertion needed: Supabase's generic type parameter doesn't always
      // propagate correctly through the query builder chain in script contexts
      const { error: updateError } = await (supabase
        .from('user_profiles') as any)
        .update(updateData)
        .eq('id', authUser.id)

      if (updateError) {
        console.error('❌ Failed to update role:', updateError.message)
        process.exit(1)
      }

      console.log('✅ Role updated to admin')
    }

    // Step 3: Verify the change
    console.log('\n4️⃣  Verifying admin access...')

    const verifyQuery = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', authUser.id)
      .single()

    if (verifyQuery.error) {
      console.error('❌ Failed to verify:', verifyQuery.error.message)
      process.exit(1)
    }

    const updatedProfile = verifyQuery.data as Pick<UserProfile, 'id' | 'email' | 'role'>

    console.log('✅ Verification successful!')
    console.log('\n📊 Admin User Details:')
    console.log(`   ID:    ${updatedProfile.id}`)
    console.log(`   Email: ${updatedProfile.email}`)
    console.log(`   Role:  ${updatedProfile.role}`)

    console.log('\n✨ Admin user setup complete!')
    console.log('\n🔐 The user can now access admin endpoints and dashboard.')
    console.log('   Admin routes: /admin/*')
    console.log('   Admin API: /api/admin/*')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

// ============================================================================
// Run Script
// ============================================================================

createAdminUser()
