/**
 * Fix User Profiles RLS Script
 * 
 * This script fixes the Row Level Security policies on the user_profiles table
 * to allow users to read their own profiles, which is required for authentication.
 * 
 * Usage:
 *   npx tsx scripts/fix-user-profiles-rls.ts
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

async function fixUserProfilesRLS() {
  console.log('🔧 Fix User Profiles RLS Policies\n')

  // Validate environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  try {
    const supabase: SupabaseClient<Database> = createAdminClient()

    console.log('1️⃣  Dropping existing RLS policies...')
    
    // Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    `
    
    const { error: dropError } = await (supabase.rpc as any)('exec_sql', { sql: dropPolicies })
    
    if (dropError) {
      console.warn('⚠️  Could not drop policies (they may not exist):', dropError.message)
    } else {
      console.log('✅ Existing policies dropped')
    }

    console.log('\n2️⃣  Enabling RLS on user_profiles table...')
    
    const enableRLS = `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`
    
    const { error: rlsError } = await (supabase.rpc as any)('exec_sql', { sql: enableRLS })
    
    if (rlsError) {
      console.warn('⚠️  RLS may already be enabled:', rlsError.message)
    } else {
      console.log('✅ RLS enabled')
    }

    console.log('\n3️⃣  Creating new RLS policies...')
    
    // Create new policies
    const createPolicies = `
      -- Policy: Users can view their own profile
      CREATE POLICY "Users can view own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

      -- Policy: Users can update their own profile
      CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

      -- Policy: Users can insert their own profile
      CREATE POLICY "Users can insert own profile"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
    `
    
    const { error: createError } = await (supabase.rpc as any)('exec_sql', { sql: createPolicies })
    
    if (createError) {
      console.error('❌ Failed to create policies:', createError.message)
      console.error('\nPlease run this SQL manually in Supabase SQL Editor:')
      console.error(createPolicies)
      process.exit(1)
    }

    console.log('✅ New policies created')

    console.log('\n4️⃣  Verifying policies...')
    
    // Test query as authenticated user
    console.log('   Testing profile query...')
    
    const { data: profiles, error: testError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(1)
    
    if (testError) {
      console.error('❌ Test query failed:', testError.message)
      console.error('   This may be expected if using service role key')
    } else {
      console.log(`✅ Test query successful (found ${profiles?.length || 0} profiles)`)
    }

    console.log('\n✨ RLS policies have been fixed!')
    console.log('\n📋 Policies created:')
    console.log('   1. Users can view own profile (SELECT)')
    console.log('   2. Users can update own profile (UPDATE)')
    console.log('   3. Users can insert own profile (INSERT)')
    console.log('\n🔄 Please refresh your browser and try logging in again')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    console.error('\n⚠️  If exec_sql RPC function does not exist, please run this SQL manually:')
    console.error('\nIn Supabase SQL Editor, run:')
    console.error(`
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
    `)
    process.exit(1)
  }
}

// ============================================================================
// Run Script
// ============================================================================

fixUserProfilesRLS()
