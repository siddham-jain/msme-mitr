/**
 * Admin Analytics Export API Endpoint
 * 
 * GET /api/admin/analytics/export
 * 
 * Exports analytics data in CSV or JSON format with optional filtering and anonymization.
 * Requires admin authentication.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { AnalyticsService } from '@/services/analytics/analyticsService';
import type { AnalyticsFilters } from '@/types/database';

/**
 * GET handler for data export
 * 
 * Query Parameters:
 * - format: 'csv' | 'json' (required)
 * - anonymize: 'true' | 'false' (default: 'false')
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
    
    // Export format (required)
    const format = searchParams.get('format');
    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format parameter',
          message: 'Format must be either "csv" or "json"'
        },
        { status: 400 }
      );
    }

    // Anonymization option
    const anonymize = searchParams.get('anonymize') === 'true';

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

    console.log('[Admin API] Exporting analytics data:', { format, anonymize, filters });

    // Export data
    const analyticsService = new AnalyticsService({ supabaseClient: supabase });
    const exportData = await analyticsService.exportData({
      format: format as 'csv' | 'json',
      filters,
      anonymize
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const anonymizedSuffix = anonymize ? '_anonymized' : '';
    const filename = `analytics_export${anonymizedSuffix}_${timestamp}.${format}`;

    // Set appropriate headers for file download
    const headers = new Headers();
    
    if (format === 'csv') {
      headers.set('Content-Type', 'text/csv; charset=utf-8');
    } else {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(exportData, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[Admin API] Error exporting analytics data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
