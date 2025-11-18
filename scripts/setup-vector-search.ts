/**
 * Set up vector search for schemes table
 * Adds embedding column and pgvector extension
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🚀 Setting up vector search for schemes...\n')

  try {
    // Enable pgvector extension
    console.log('1️⃣  Enabling pgvector extension...')
    const { error: extError } = await supabase.rpc('enable_pgvector')

    // Create the RPC function if it doesn't exist
    if (extError) {
      console.log('   Creating enable function...')
      await supabase.rpc('exec_sql', {
        sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
      })
    }

    console.log('   ✅ pgvector extension enabled\n')

    // Add embedding column
    console.log('2️⃣  Adding embedding column to schemes table...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE schemes ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);'
    })

    if (alterError) {
      console.log('   ⚠️  Could not add column via RPC')
      console.log('   Please run the SQL manually in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(60))
      console.log('-- Enable pgvector extension')
      console.log('CREATE EXTENSION IF NOT EXISTS vector;')
      console.log('')
      console.log('-- Add embedding column')
      console.log('ALTER TABLE schemes ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);')
      console.log('')
      console.log('-- Create index for vector search')
      console.log('CREATE INDEX IF NOT EXISTS idx_schemes_embedding')
      console.log('ON schemes USING ivfflat (embedding vector_cosine_ops)')
      console.log('WITH (lists = 100);')
      console.log('='.repeat(60) + '\n')
      return
    }

    console.log('   ✅ Embedding column added\n')

    // Create vector index
    console.log('3️⃣  Creating vector similarity index...')
    await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_schemes_embedding
            ON schemes USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);`
    })
    console.log('   ✅ Vector index created\n')

    console.log('✨ Vector search setup complete!')
    console.log('   You can now generate embeddings using: npm run generate-embeddings')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    console.log('\n📝 Manual Setup Instructions:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Run the SQL from scripts/add-embedding-column.sql')
    console.log('   3. Then run: npm run generate-embeddings')
  }
}

main()
