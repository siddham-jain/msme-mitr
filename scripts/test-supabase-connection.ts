#!/usr/bin/env tsx

/**
 * Test Supabase Connection
 * 
 * Quick script to verify Supabase connectivity and query performance
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔍 Testing Supabase Connection...')
console.log('📍 URL:', supabaseUrl)
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Basic Connectivity')
    const start1 = Date.now()
    const { data: healthData, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    const duration1 = Date.now() - start1
    
    if (healthError) {
      console.log(`❌ Failed (${duration1}ms):`, healthError.message)
    } else {
      console.log(`✅ Success (${duration1}ms)`)
    }
    console.log('')

    // Test 2: Query user_profiles
    console.log('Test 2: Query user_profiles table')
    const start2 = Date.now()
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(5)
    const duration2 = Date.now() - start2
    
    if (profileError) {
      console.log(`❌ Failed (${duration2}ms):`, profileError.message)
    } else {
      console.log(`✅ Success (${duration2}ms)`)
      console.log(`   Found ${profiles?.length || 0} profiles`)
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          console.log(`   - ${p.email} (${p.role})`)
        })
      }
    }
    console.log('')

    // Test 3: Query conversations
    console.log('Test 3: Query conversations table')
    const start3 = Date.now()
    const { count, error: convError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
    const duration3 = Date.now() - start3
    
    if (convError) {
      console.log(`❌ Failed (${duration3}ms):`, convError.message)
    } else {
      console.log(`✅ Success (${duration3}ms)`)
      console.log(`   Total conversations: ${count || 0}`)
    }
    console.log('')

    // Test 4: Check RLS status
    console.log('Test 4: Check RLS Status')
    const start4 = Date.now()
    let rlsData = null
    let rlsError = null
    try {
      const result = await supabase.rpc('check_rls_status')
      rlsData = result.data
      rlsError = result.error
    } catch (err) {
      // If RPC doesn't exist, that's okay
      rlsError = null
    }
    const duration4 = Date.now() - start4
    
    if (rlsError) {
      console.log(`⚠️  Could not check RLS status (${duration4}ms)`)
    } else {
      console.log(`✅ RLS check completed (${duration4}ms)`)
    }
    console.log('')

    // Summary
    console.log('═══════════════════════════════════════')
    console.log('Summary:')
    console.log('═══════════════════════════════════════')
    
    const avgDuration = (duration1 + duration2 + duration3) / 3
    
    if (avgDuration < 500) {
      console.log('✅ Connection is FAST (avg:', Math.round(avgDuration), 'ms)')
    } else if (avgDuration < 2000) {
      console.log('⚠️  Connection is SLOW (avg:', Math.round(avgDuration), 'ms)')
      console.log('   Consider checking your network or Supabase region')
    } else {
      console.log('❌ Connection is VERY SLOW (avg:', Math.round(avgDuration), 'ms)')
      console.log('   This will cause timeout issues in the app')
      console.log('   Recommendations:')
      console.log('   1. Check your internet connection')
      console.log('   2. Verify Supabase project is in a nearby region')
      console.log('   3. Check Supabase dashboard for any issues')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

testConnection()
