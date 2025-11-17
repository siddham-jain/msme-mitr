/**
 * Admin Test Endpoint
 * 
 * Simple endpoint to test admin authentication.
 * This demonstrates how to use the requireAdmin middleware.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/adminAuth'
import { success } from '@/lib/api/auth'

/**
 * GET /api/admin/test
 * 
 * Test endpoint that requires admin authentication.
 * Returns user info if authenticated as admin.
 * 
 * @returns 200 with user info if admin
 * @returns 401 if not authenticated
 * @returns 403 if authenticated but not admin
 */
export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(request)
  
  // Check if authentication/authorization failed
  if (authResult instanceof NextResponse) {
    return authResult // Returns 401 or 403 error
  }
  
  // User is authenticated and has admin role
  const { user, profile } = authResult
  
  return success({
    message: 'Admin access granted',
    user: {
      id: user.id,
      email: user.email,
      role: profile.role,
    },
    timestamp: new Date().toISOString(),
  })
}
