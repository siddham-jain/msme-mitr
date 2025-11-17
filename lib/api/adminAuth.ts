/**
 * Admin Authentication Middleware
 * 
 * This module provides middleware for protecting admin-only API routes.
 * It verifies that the user is authenticated and has admin or super_admin role.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @module lib/api/adminAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole, type RoleAuthResult } from './auth'

// ============================================================================
// Admin Authentication
// ============================================================================

/**
 * Requires admin authentication for an API route
 * 
 * This middleware:
 * - Verifies the user is authenticated (Requirement 3.1, 3.3)
 * - Checks the user has 'admin' or 'super_admin' role (Requirement 3.2, 3.4)
 * - Returns 401 for unauthenticated users (Requirement 3.5)
 * - Returns 403 for authenticated non-admin users (Requirement 3.5)
 * 
 * @param request - The Next.js request object
 * @returns RoleAuthResult with user, profile, and supabase client, or NextResponse with error
 * 
 * @example
 * ```typescript
 * // In an admin API route
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdmin(request)
 *   
 *   if (authResult instanceof NextResponse) {
 *     return authResult // Return error response (401 or 403)
 *   }
 *   
 *   const { user, profile, supabase } = authResult
 *   // User is authenticated and has admin role
 *   // Continue with admin-only logic...
 * }
 * ```
 */
export async function requireAdmin(
  request: NextRequest
): Promise<RoleAuthResult | NextResponse> {
  // Use requireRole to check for admin or super_admin role
  // This handles:
  // - Authentication verification (returns 401 if not authenticated)
  // - Role checking (returns 403 if not admin/super_admin)
  return requireRole(request, ['admin', 'super_admin'])
}

/**
 * Type guard to check if the result is an error response
 * 
 * @param result - The result from requireAdmin
 * @returns true if the result is an error response (NextResponse)
 * 
 * @example
 * ```typescript
 * const authResult = await requireAdmin(request)
 * 
 * if (isErrorResponse(authResult)) {
 *   return authResult
 * }
 * 
 * // TypeScript now knows authResult is RoleAuthResult
 * const { user, profile } = authResult
 * ```
 */
export function isErrorResponse(
  result: RoleAuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}

/**
 * Checks if a user profile has admin privileges
 * 
 * @param role - The user's role
 * @returns true if the user is an admin or super_admin
 * 
 * @example
 * ```typescript
 * if (isAdmin(profile.role)) {
 *   // User has admin privileges
 * }
 * ```
 */
export function isAdmin(role: 'user' | 'admin' | 'super_admin'): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Checks if a user profile has super admin privileges
 * 
 * @param role - The user's role
 * @returns true if the user is a super_admin
 * 
 * @example
 * ```typescript
 * if (isSuperAdmin(profile.role)) {
 *   // User has super admin privileges
 * }
 * ```
 */
export function isSuperAdmin(role: 'user' | 'admin' | 'super_admin'): boolean {
  return role === 'super_admin'
}
