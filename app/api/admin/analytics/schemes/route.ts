/**
 * Admin Scheme Interests API Endpoint
 * 
 * GET /api/admin/analytics/schemes
 * 
 * Returns paginated scheme interests with scheme details, optional filtering and sorting.
 * Requires admin authentication.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import type { AnalyticsFilters } from '@/types/database';

/**
 * GET handler for scheme interests
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20)
 * - sortField: string (default: 'last_mentioned_at')
 * - sortDirection: 'asc' | 'desc' (default: 'desc')
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - schemeId: UUID (optional)
 * - location: string (optional) - filters by user location
 * - industry: string (optional) - filters by user industry
 * - businessSize: 'Micro' | 'Small' | 'Medium' (optional) - filters by user business size
 * - languages: comma-separated string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 or 403 error
    }

    const { supabase } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Sorting parameters
    const sortField = searchParams.get('sortField') || 'last_mentioned_at';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';

    // Filters
    const filters: AnalyticsFilters = {};

    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = {
        startDate,
        endDate
      };
    }

    // Scheme filter
    const schemeId = searchParams.get('schemeId');
    if (schemeId) {
      filters.schemeId = schemeId;
    }

    // Location filter (filters by user location)
    const location = searchParams.get('location');
    if (location) {
      filters.location = location;
    }

    // Industry filter (filters by user industry)
    const industry = searchParams.get('industry');
    if (industry) {
      filters.industry = industry;
    }

    // Business size filter (filters by user business size)
    const businessSize = searchParams.get('businessSize');
    if (businessSize && ['Micro', 'Small', 'Medium'].includes(businessSize)) {
      filters.businessSize = businessSize as 'Micro' | 'Small' | 'Medium';
    }

    // Languages filter (comma-separated)
    const languagesParam = searchParams.get('languages');
    if (languagesParam) {
      filters.languages = languagesParam.split(',').map(lang => lang.trim());
    }

    console.log('[Admin API] Getting scheme interests:', { page, pageSize, sortField, sortDirection, filters });

    // Get scheme interests
    const analyticsService = new AnalyticsService({ supabaseClient: supabase });
    const result = await analyticsService.getSchemeInterests(
      filters,
      { page, pageSize },
      { field: sortField, direction: sortDirection }
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('[Admin API] Error getting scheme interests:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheme interests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
