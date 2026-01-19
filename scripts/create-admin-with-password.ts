/**
 * Create Admin User with Password Script
 * 
 * This script creates a new admin user with email and password directly in Supabase.
 * 
 * Usage:
 *   npm run tsx scripts/create-admin-with-password.ts <email> <password>
 * 
 * Example:
 *   npm run tsx scripts/create-admin-with-password.ts admin@test.com Admin123!
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserProfileInsert } from '@/types/database'

// ============================================================================
// Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

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

async function createAdminWithPassword() {
  console.log('🔧 Admin User Creation Utility\n')

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('  - SUPABASE_SECRET_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  // Get email and password from command line arguments
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Email and password required!')
    console.error('\nUsage:')
    console.error('  npx tsx scripts/create-admin-with-password.ts <email> <password>')
    console.error('\nExample:')
    console.error('  npx tsx scripts/create-admin-with-password.ts admin@test.com Admin123!')
    process.exit(1)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error(`❌ Invalid email format: ${email}`)
    process.exit(1)
  }

  // Validate password strength
  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long')
    process.exit(1)
  }

  console.log(`📧 Email: ${email}`)
  console.log(`🔒 Password: ${'*'.repeat(password.length)}\n`)

  try {
    // Create Supabase client with service role key
    const supabase: SupabaseClient<Database> = createAdminClient()

    // Step 1: Check if user already exists
    console.log('1️⃣  Checking if user already exists...')

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
      process.exit(1)
    }

    const existingUser = users.find(u => u.email === email)

    if (existingUser) {
      console.log(`⚠️  User ${email} already exists with ID: ${existingUser.id}`)
      console.log('\n2️⃣  Updating to admin role...')

      // Update existing user to admin
      const { error: updateError } = await (supabase
        .from('user_profiles') as any)
        .update({ role: 'admin' })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('❌ Failed to update role:', updateError.message)
        process.exit(1)
      }

      console.log('✅ User updated to admin role')
      console.log('\n✨ Admin credentials:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log(`   Role: admin`)
      return
    }

    // Step 2: Create new user
    console.log('✅ User does not exist, creating new user...')
    console.log('\n2️⃣  Creating user in auth system...')

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin User'
      }
    })

    if (createError) {
      console.error('❌ Failed to create user:', createError.message)
      process.exit(1)
    }

    if (!authData.user) {
      console.error('❌ User creation failed: No user data returned')
      process.exit(1)
    }

    console.log(`✅ User created with ID: ${authData.user.id}`)

    // Step 3: Create user profile with admin role
    console.log('\n3️⃣  Creating admin profile...')

    const newProfile: UserProfileInsert = {
      id: authData.user.id,
      email: authData.user.email!,
      role: 'admin',
      language: 'en',
      preferred_model: 'anthropic/claude-3-haiku'
    }

    const { error: insertError } = await (supabase
      .from('user_profiles') as any)
      .insert(newProfile)

    if (insertError) {
      // Check if profile already exists
      if (insertError.code === '23505') {
        console.log('⚠️  Profile already exists, updating role...')

        const { error: updateError } = await (supabase
          .from('user_profiles') as any)
          .update({ role: 'admin' })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('❌ Failed to update profile:', updateError.message)
          process.exit(1)
        }

        console.log('✅ Profile updated to admin role')
      } else {
        console.error('❌ Failed to create profile:', insertError.message)
        console.error('   Attempting to delete auth user...')

        // Cleanup: delete the auth user if profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id)

        process.exit(1)
      }
    } else {
      console.log('✅ Admin profile created')
    }

    console.log('✅ Admin profile created')

    // Step 4: Verify the creation
    console.log('\n4️⃣  Verifying admin access...')

    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single<{ id: string; email: string; role: string }>()

    if (verifyError || !verifyData) {
      console.error('❌ Failed to verify:', verifyError?.message || 'No data returned')
      process.exit(1)
    }

    console.log('✅ Verification successful!')
    console.log('\n📊 Admin User Details:')
    console.log(`   ID:    ${verifyData.id}`)
    console.log(`   Email: ${verifyData.email}`)
    console.log(`   Role:  ${verifyData.role}`)

    console.log('\n✨ Admin user created successfully!')
    console.log('\n🔐 Login Credentials:')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n📍 Access the admin dashboard at:')
    console.log('   http://localhost:3000/admin')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

// ============================================================================
// Run Script
// ============================================================================

createAdminWithPassword()
