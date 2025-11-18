import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedSchemes() {
  console.log('🌱 Starting schemes seed...\n')

  try {
    // Read schemes JSON
    const schemesPath = join(process.cwd(), 'data', 'schemes.json')
    const schemesData = JSON.parse(readFileSync(schemesPath, 'utf-8'))

    console.log(`📋 Found ${schemesData.schemes.length} schemes in data/schemes.json`)

    // Check existing schemes
    const { count: existingCount } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Current schemes in database: ${existingCount}\n`)

    if (existingCount && existingCount > 0) {
      console.log('⚠️  Schemes already exist. Skipping seed.')
      console.log('   To re-seed, delete existing schemes first.\n')
      return
    }

    // Insert schemes
    let successCount = 0
    let errorCount = 0

    for (const scheme of schemesData.schemes) {
      const schemeData = {
        scheme_name: scheme.scheme_name,
        scheme_url: scheme.scheme_url || null,
        ministry: scheme.ministry || null,
        description: scheme.description || null,
        category: scheme.category || null,
        details: scheme.details || null,
        benefits: scheme.benefits || null,
        eligibility: scheme.eligibility || null,
        application_process: scheme.application_process || null,
        documents_required: scheme.documents_required || null,
        financial_details: scheme.financial_details || null,
        tags: scheme.tags || [],
        target_audience: scheme.target_audience || [],
        is_active: true,
      }

      const { error } = await supabase
        .from('schemes')
        .insert([schemeData])

      if (error) {
        console.error(`❌ Error inserting "${scheme.scheme_name}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ Inserted: ${scheme.scheme_name}`)
        successCount++
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('🎉 Seeding complete!')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`${'='.repeat(50)}\n`)

    // Verify final count
    const { count: finalCount } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Total schemes in database: ${finalCount}`)

  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

seedSchemes()
