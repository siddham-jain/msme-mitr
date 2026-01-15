'use client'

/**
 * Admin Dashboard Page
 * 
 * Main dashboard page for admin analytics with:
 * - Filter panel for data segmentation
 * - Stat cards showing key metrics
 * - Charts for data visualization
 * - Export functionality
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * @module app/admin/dashboard/page
 */

import { useState, useEffect } from 'react'
import { FilterPanel } from '@/components/admin/FilterPanel'
import { StatCards } from '@/components/admin/StatCards'
import { SchemePopularityChart } from '@/components/admin/charts/SchemePopularityChart'
import { IndustryDistributionChart } from '@/components/admin/charts/IndustryDistributionChart'
import { LocationDistributionChart } from '@/components/admin/charts/LocationDistributionChart'
import { ConversationTrendChart } from '@/components/admin/charts/ConversationTrendChart'
import { ExportButton } from '@/components/admin/ExportButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { AnalyticsSummary, AnalyticsFilters } from '@/types/database'

// ============================================================================
// Component
// ============================================================================

export default function AdminDashboardPage() {
  // State
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch analytics summary
   */
  const fetchSummary = async (appliedFilters: AnalyticsFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      // Build query string
      const params = new URLSearchParams()

      if (appliedFilters.dateRange) {
        params.set('startDate', appliedFilters.dateRange.startDate)
        params.set('endDate', appliedFilters.dateRange.endDate)
      }

      if (appliedFilters.location) {
        params.set('location', appliedFilters.location)
      }

      if (appliedFilters.industry) {
        params.set('industry', appliedFilters.industry)
      }

      if (appliedFilters.schemeId) {
        params.set('schemeId', appliedFilters.schemeId)
      }

      if (appliedFilters.businessSize) {
        params.set('businessSize', appliedFilters.businessSize)
      }

      if (appliedFilters.languages && appliedFilters.languages.length > 0) {
        params.set('languages', appliedFilters.languages.join(','))
      }

      const queryString = params.toString()
      const url = `/api/admin/analytics/summary${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch analytics data')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSummary(result.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching analytics summary:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load analytics data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    fetchSummary(newFilters)
  }

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">Analytics Dashboard</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                View insights and metrics about user engagement with MSME schemes
              </p>
            </div>
            <ExportButton filters={filters} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="px-6 py-4">
          <FilterPanel 
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="flex-1 px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <StatCards summary={summary} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheme Popularity Chart */}
          <div className="lg:col-span-2">
            <SchemePopularityChart summary={summary} loading={loading} />
          </div>

          {/* Industry Distribution Chart */}
          <IndustryDistributionChart summary={summary} loading={loading} />

          {/* Location Distribution Chart */}
          <LocationDistributionChart summary={summary} loading={loading} />

          {/* Conversation Trend Chart */}
          <div className="lg:col-span-2">
            <ConversationTrendChart summary={summary} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
