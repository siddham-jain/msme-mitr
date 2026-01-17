import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/services/ai/openRouterService';
import { schemeDataService } from '@/services/schemes/schemeDataService';

/**
 * Health Check Endpoint
 * Returns the status of various services
 */
export async function GET(_request: NextRequest) {
  try {
    const schemes = await schemeDataService.getAllSchemes();
    const cacheStats = schemeDataService.getCacheStats();
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        schemeData: {
          status: 'operational',
          schemesCount: schemes.length,
          cacheMode: cacheStats.mode,
          cacheSize: cacheStats.size
        },
        openRouter: {
          status: openRouterService.isConfigured() ? 'configured' : 'not_configured',
          apiKeyPresent: !!process.env.OPENROUTER_API_KEY
        }
      }
    };

    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'ok'
      }
    });
  } catch (_error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal service error'
      },
      { status: 503 }
    );
  }
}