/**
 * Test script to verify Supabase client initialization
 * This file can be used to test both client and server configurations
 */

import { createClient as createBrowserClient } from './client'

/**
 * Test client-side Supabase client initialization
 */
export function testClientSideClient() {
  try {
    const supabase = createBrowserClient()

    // Verify client is created
    if (!supabase) {
      throw new Error('Failed to create browser client')
    }

    // Verify environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set')
    }

    console.log('✅ Client-side Supabase client initialized successfully')
    console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('   Key:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...')

    return true
  } catch (error) {
    console.error('❌ Client-side client initialization failed:', error)
    return false
  }
}

/**
 * Test server-side Supabase client initialization
 * Note: This requires being called from a server context
 */
export async function testServerSideClient() {
  try {
    // Dynamic import to avoid issues in client-side contexts
    const { createClient: createServerClient } = await import('./server')

    const supabase = await createServerClient()

    // Verify client is created
    if (!supabase) {
      throw new Error('Failed to create server client')
    }

    console.log('✅ Server-side Supabase client initialized successfully')

    return true
  } catch (error) {
    console.error('❌ Server-side client initialization failed:', error)
    return false
  }
}
