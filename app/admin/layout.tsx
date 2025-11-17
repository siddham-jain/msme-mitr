'use client'

/**
 * Admin Layout Component
 * 
 * Provides the layout wrapper for all admin pages with:
 * - Admin authentication check
 * - Redirect to login if not authenticated
 * - Role check (show 403 if not admin)
 * - Admin navigation sidebar
 * - Logout functionality
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @module app/admin/layout
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminNav } from '@/components/admin/AdminNav'
import { Spinner } from '@/components/ui/spinner'

// ============================================================================
// Component
// ============================================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Wait for auth to load
    if (loading) return

    // Requirement 3.1, 3.3: Check if user is authenticated
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    // Requirement 3.2, 3.4: Check if user has admin role
    if (!profile) {
      // Profile not loaded yet, wait
      return
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
    
    if (!isAdmin) {
      // User is authenticated but not an admin
      // Show 403 error (handled by rendering 403 message)
      setIsAuthorized(false)
      return
    }

    // User is authenticated and has admin role
    setIsAuthorized(true)
  }, [user, profile, loading, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting to login
  if (!user) {
    return null
  }

  // Requirement 3.5: Show 403 error if user is not an admin
  if (!isAuthorized && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-destructive">403</h1>
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You do not have permission to access the admin dashboard.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This area is restricted to administrators only.
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-primary hover:underline text-sm"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while profile is being loaded
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Render admin layout with navigation sidebar
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <div className="h-full fixed w-64">
          <AdminNav />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
