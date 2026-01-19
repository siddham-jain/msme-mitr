/**
 * Analytics-specific Supabase client
 * 
 * Provides a properly typed Supabase client for analytics operations
 * with full type inference for the new analytics tables.
 * 
 * This uses the service role key for server-side operations that don't require
 * user authentication context (like background job processing).
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Type for the analytics Supabase client
 */
export type AnalyticsClient = SupabaseClient<Database>;

/**
 * Create a properly typed Supabase client for analytics operations
 * 
 * Uses service role key for server-side analytics operations.
 * This client has full database access and bypasses RLS.
 */
export function createAnalyticsClient(): AnalyticsClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
