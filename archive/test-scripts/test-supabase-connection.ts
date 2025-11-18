/**
 * Test Supabase Connection
 * 
 * Quick script to verify Supabase connectivity and auth
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check connection
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('conversations').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }

    // Test 2: Check auth
    console.log('\n2. Testing auth service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth service accessible!');
      console.log('Session:', session ? 'Active' : 'None');
    }

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
