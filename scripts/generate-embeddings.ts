/**
 * Generate embeddings for all schemes in the database
 * Run this script once to populate the embedding column
 */

import { createClient } from '@supabase/supabase-js'
import { generateSchemeEmbeddings } from '../lib/ai/openrouter'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.local')
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🚀 Starting embedding generation for schemes...\n')

  try {
    // 1. Fetch all schemes from database
    console.log('📥 Fetching schemes from database...')
    const { data: schemes, error: fetchError } = await supabase
      .from('schemes')
      .select('*')

    if (fetchError) {
      throw new Error(`Failed to fetch schemes: ${fetchError.message}`)
    }

    if (!schemes || schemes.length === 0) {
      console.log('⚠️  No schemes found in database. Run seed-schemes.ts first.')
      return
    }

    console.log(`✅ Found ${schemes.length} schemes\n`)

    // 2. Generate embeddings for each scheme
    console.log('🔄 Generating embeddings (this may take a few minutes)...\n')
    const embeddings = await generateSchemeEmbeddings(schemes)

    // 3. Update database with embeddings
    console.log('\n💾 Updating database with embeddings...')
    let successCount = 0
    let failCount = 0

    for (const { id, embedding } of embeddings) {
      const { error: updateError } = await supabase
        .from('schemes')
        .update({ embedding })
        .eq('id', id)

      if (updateError) {
        console.error(`✗ Failed to update scheme ${id}:`, updateError.message)
        failCount++
      } else {
        successCount++
      }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`   Total schemes: ${schemes.length}`)
    console.log(`   ✅ Successfully updated: ${successCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log('='.repeat(50))

    if (successCount === schemes.length) {
      console.log('\n✨ All embeddings generated successfully!')
      console.log('   Scheme recommendations are now ready to use.')
    } else {
      console.log('\n⚠️  Some embeddings failed. Check logs above.')
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
