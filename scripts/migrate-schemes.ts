/**
 * Schemes Data Migration Script
 * 
 * This script migrates scheme data from data/schemes.json to the Supabase database.
 * It parses the JSON file, transforms the data to match the database schema,
 * and inserts the schemes into the database.
 * 
 * Usage: npx tsx scripts/migrate-schemes.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '@/types/database'

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface SchemeJSON {
  scheme_name: string
  scheme_url: string
  ministry: string
  description: string
  tags: string[]
  details: string
  benefits: string
  eligibility: string
  application_process: {
    content: string
    has_tabs: boolean
  } | null
  documents_required: string | null
  faqs: any | null
  sources: Array<{
    text: string
    url: string
  }>
}

interface SchemesData {
  extraction_date: string
  source_url: string
  total_schemes: number
  schemes: SchemeJSON[]
}

/**
 * Transform JSON scheme data to match database schema
 */
function transformScheme(scheme: SchemeJSON) {
  return {
    scheme_name: scheme.scheme_name,
    scheme_url: scheme.scheme_url,
    ministry: scheme.ministry,
    description: scheme.description,
    category: extractCategory(scheme.ministry),
    tags: scheme.tags || [],
    target_audience: extractTargetAudience(scheme.tags),
    details: {
      content: scheme.details,
      sources: scheme.sources || []
    },
    benefits: {
      content: scheme.benefits
    },
    eligibility: {
      content: scheme.eligibility
    },
    application_process: scheme.application_process || null,
    documents_required: scheme.documents_required ? {
      content: scheme.documents_required
    } : null,
    financial_details: extractFinancialDetails(scheme.details),
    is_active: true
  }
}

/**
 * Extract category from ministry name
 */
function extractCategory(ministry: string): string {
  if (ministry.toLowerCase().includes('msme') ||
    ministry.toLowerCase().includes('micro, small and medium')) {
    return 'MSME'
  }
  if (ministry.toLowerCase().includes('finance')) {
    return 'Finance'
  }
  if (ministry.toLowerCase().includes('skill')) {
    return 'Skill Development'
  }
  return 'General'
}

/**
 * Extract target audience from tags
 */
function extractTargetAudience(tags: string[]): string[] {
  const audienceKeywords = [
    'Entrepreneur', 'Artisans', 'Craftspeople', 'Women',
    'SC', 'ST', 'OBC', 'Minorities', 'Youth', 'Mahila'
  ]

  return tags.filter(tag =>
    audienceKeywords.some(keyword =>
      tag.toLowerCase().includes(keyword.toLowerCase())
    )
  )
}

/**
 * Extract financial details from scheme details text
 */
function extractFinancialDetails(details: string): any {
  const financialInfo: any = {}

  // Extract subsidy information
  const subsidyMatch = details.match(/subsidy[:\s]+([^.\n]+)/i)
  if (subsidyMatch) {
    financialInfo.subsidy = subsidyMatch[1].trim()
  }

  // Extract loan information
  const loanMatch = details.match(/loan[:\s]+([^.\n]+)/i)
  if (loanMatch) {
    financialInfo.loan = loanMatch[1].trim()
  }

  // Extract amount information (₹ symbol)
  const amountMatches = details.match(/₹\s*[\d,]+/g)
  if (amountMatches && amountMatches.length > 0) {
    financialInfo.amounts = amountMatches
  }

  return Object.keys(financialInfo).length > 0 ? financialInfo : null
}

/**
 * Remove duplicate schemes based on scheme_name and scheme_url
 */
function deduplicateSchemes(schemes: SchemeJSON[]): SchemeJSON[] {
  const seen = new Set<string>()
  const unique: SchemeJSON[] = []

  for (const scheme of schemes) {
    const key = `${scheme.scheme_name}|${scheme.scheme_url}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(scheme)
    }
  }

  return unique
}

/**
 * Main migration function
 */
async function migrateSchemes() {
  console.log('🚀 Starting schemes data migration...\n')

  try {
    // Step 1: Read and parse schemes.json
    console.log('📖 Reading schemes.json file...')
    const schemesPath = path.join(process.cwd(), 'data', 'schemes.json')

    if (!fs.existsSync(schemesPath)) {
      throw new Error(`Schemes file not found at: ${schemesPath}`)
    }

    const fileContent = fs.readFileSync(schemesPath, 'utf-8')
    const schemesData: SchemesData = JSON.parse(fileContent)

    console.log(`✅ Found ${schemesData.total_schemes} schemes in JSON file`)
    console.log(`   Source: ${schemesData.source_url}`)
    console.log(`   Extraction Date: ${schemesData.extraction_date}\n`)

    // Step 2: Deduplicate schemes
    console.log('🔍 Removing duplicate schemes...')
    const uniqueSchemes = deduplicateSchemes(schemesData.schemes)
    console.log(`✅ ${uniqueSchemes.length} unique schemes after deduplication\n`)

    // Step 3: Transform data
    console.log('🔄 Transforming scheme data...')
    const transformedSchemes = uniqueSchemes.map(transformScheme)
    console.log(`✅ Transformed ${transformedSchemes.length} schemes\n`)

    // Step 4: Check existing schemes in database
    console.log('🔍 Checking existing schemes in database...')
    const { data: existingSchemes, error: fetchError } = await supabase
      .from('schemes')
      .select('scheme_name, scheme_url')

    if (fetchError) {
      throw new Error(`Failed to fetch existing schemes: ${fetchError.message}`)
    }

    console.log(`   Found ${existingSchemes?.length || 0} existing schemes in database\n`)

    // Step 5: Filter out schemes that already exist
    const existingKeys = new Set(
      existingSchemes?.map((s: any) => `${s.scheme_name}|${s.scheme_url}`) || []
    )

    const newSchemes = transformedSchemes.filter(scheme => {
      const key = `${scheme.scheme_name}|${scheme.scheme_url}`
      return !existingKeys.has(key)
    })

    if (newSchemes.length === 0) {
      console.log('ℹ️  No new schemes to insert. All schemes already exist in database.')
      return
    }

    console.log(`📝 Inserting ${newSchemes.length} new schemes into database...\n`)

    // Step 6: Insert schemes in batches (to avoid payload size limits)
    const batchSize = 10
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < newSchemes.length; i += batchSize) {
      const batch = newSchemes.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(newSchemes.length / batchSize)

      console.log(`   Processing batch ${batchNumber}/${totalBatches} (${batch.length} schemes)...`)

      const { data, error } = await supabase
        .from('schemes')
        .insert(batch as any)
        .select()

      if (error) {
        console.error(`   ❌ Error in batch ${batchNumber}:`, error.message)
        errorCount += batch.length
      } else {
        console.log(`   ✅ Batch ${batchNumber} inserted successfully`)
        successCount += data?.length || 0
      }
    }

    // Step 7: Verify data integrity
    console.log('\n🔍 Verifying data integrity...')
    const { count, error: countError } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Failed to verify data: ${countError.message}`)
    }

    console.log(`✅ Total schemes in database: ${count}\n`)

    // Step 8: Summary
    console.log('📊 Migration Summary:')
    console.log(`   Total schemes in JSON: ${schemesData.total_schemes}`)
    console.log(`   Unique schemes: ${uniqueSchemes.length}`)
    console.log(`   Already in database: ${existingSchemes?.length || 0}`)
    console.log(`   New schemes inserted: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   Failed insertions: ${errorCount}`)
    }
    console.log(`   Final database count: ${count}`)

    console.log('\n✨ Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateSchemes()
