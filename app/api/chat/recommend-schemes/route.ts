import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/ai/openrouter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, userProfile } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 1. Generate embedding for user query
    console.log('Generating embedding for query:', query)
    const queryEmbedding = await generateEmbedding(query)

    // 2. Build filter conditions based on user profile
    let filterQuery = supabase
      .from('schemes')
      .select('*')
      .limit(20) // Get top 20 by vector similarity, then filter

    // Add structured filters if user profile is available
    if (userProfile) {
      // Filter by business size
      if (userProfile.business_size) {
        filterQuery = filterQuery.contains('target_business_size', [userProfile.business_size])
      }

      // Filter by state (if state-specific)
      if (userProfile.state) {
        filterQuery = filterQuery.or(`state_specific.eq.${userProfile.state},state_specific.is.null`)
      }

      // Filter by turnover range
      if (userProfile.annual_turnover) {
        filterQuery = filterQuery
          .or(`annual_turnover_min.is.null,annual_turnover_min.lte.${userProfile.annual_turnover}`)
          .or(`annual_turnover_max.is.null,annual_turnover_max.gte.${userProfile.annual_turnover}`)
      }

      // Filter by employee count
      if (userProfile.employee_count) {
        filterQuery = filterQuery
          .or(`employee_count_min.is.null,employee_count_min.lte.${userProfile.employee_count}`)
          .or(`employee_count_max.is.null,employee_count_max.gte.${userProfile.employee_count}`)
      }
    }

    // 3. Perform vector similarity search
    // Note: Supabase JS doesn't support vector operations directly yet
    // We need to use RPC or raw SQL for vector similarity
    const { data: schemes, error: searchError } = await supabase.rpc(
      'match_schemes',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5
      }
    )

    if (searchError) {
      // Fallback: If vector search function doesn't exist, use basic filtering
      console.warn('Vector search not available, falling back to basic filtering')
      const { data: fallbackSchemes, error: fallbackError } = await filterQuery

      if (fallbackError) {
        throw fallbackError
      }

      return NextResponse.json({
        schemes: fallbackSchemes?.slice(0, 5) || [],
        method: 'basic_filtering'
      })
    }

    // 4. Apply user profile filters to vector search results
    let filteredSchemes = schemes || []

    if (userProfile) {
      filteredSchemes = filteredSchemes.filter((scheme: any) => {
        // Filter by business size
        if (userProfile.business_size && scheme.target_business_size) {
          if (!scheme.target_business_size.includes(userProfile.business_size)) {
            return false
          }
        }

        // Filter by state
        if (userProfile.state && scheme.state_specific) {
          if (scheme.state_specific !== userProfile.state) {
            return false
          }
        }

        // Filter by turnover
        if (userProfile.annual_turnover) {
          if (scheme.annual_turnover_min && userProfile.annual_turnover < scheme.annual_turnover_min) {
            return false
          }
          if (scheme.annual_turnover_max && userProfile.annual_turnover > scheme.annual_turnover_max) {
            return false
          }
        }

        // Filter by employee count
        if (userProfile.employee_count) {
          if (scheme.employee_count_min && userProfile.employee_count < scheme.employee_count_min) {
            return false
          }
          if (scheme.employee_count_max && userProfile.employee_count > scheme.employee_count_max) {
            return false
          }
        }

        return true
      })
    }

    // 5. Return top 5 schemes
    const topSchemes = filteredSchemes.slice(0, 5)

    return NextResponse.json({
      schemes: topSchemes,
      method: 'vector_search',
      total_matches: filteredSchemes.length
    })

  } catch (error) {
    console.error('Scheme recommendation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recommend schemes' },
      { status: 500 }
    )
  }
}
