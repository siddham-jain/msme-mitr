/**
 * Admin Analytics Summary API Endpoint
 * 
 * GET /api/admin/analytics/summary
 * 
 * Returns aggregated analytics data with optional filtering.
 * Requires admin authentication.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import type { AnalyticsFilters } from '@/types/database';

/**
 * GET handler for analytics summary
 * 
 * Query Parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - location: string (optional)
 * - industry: string (optional)
 * - schemeId: UUID (optional)
 * - businessSize: 'Micro' | 'Small' | 'Medium' (optional)
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

    // Location filter
    const location = searchParams.get('location');
    if (location) {
      filters.location = location;
    }

    // Industry filter
    const industry = searchParams.get('industry');
    if (industry) {
      filters.industry = industry;
    }

    // Scheme filter
    const schemeId = searchParams.get('schemeId');
    if (schemeId) {
      filters.schemeId = schemeId;
    }

    // Business size filter
    const businessSize = searchParams.get('businessSize');
    if (businessSize && ['Micro', 'Small', 'Medium'].includes(businessSize)) {
      filters.businessSize = businessSize as 'Micro' | 'Small' | 'Medium';
    }

    // Languages filter (comma-separated)
    const languagesParam = searchParams.get('languages');
    if (languagesParam) {
      filters.languages = languagesParam.split(',').map(lang => lang.trim());
    }

    console.log('[Admin API] Getting analytics summary with filters:', filters);

    // Get analytics summary
    const analyticsService = new AnalyticsService({ supabaseClient: supabase });
    const summary = await analyticsService.getSummary(filters);

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('[Admin API] Error getting analytics summary:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get analytics summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
