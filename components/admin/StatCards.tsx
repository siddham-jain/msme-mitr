'use client'

/**
 * Stat Cards Component
 * 
 * Displays key analytics metrics in card format:
 * - Total users count
 * - Total conversations count
 * - Unique locations count
 * - Unique industries count
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * @module components/admin/StatCards
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, MessageSquare, MapPin, Briefcase } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface StatCardsProps {
  summary: AnalyticsSummary | null
  loading?: boolean
}

interface StatCardData {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  description: string
}

// ============================================================================
// Component
// ============================================================================

export function StatCards({ summary, loading = false }: StatCardsProps) {
  /**
   * Prepare stat card data
   */
  const stats: StatCardData[] = [
    {
      title: 'Total Users',
      value: summary?.totalUsers || 0,
      icon: Users,
      description: 'Unique users who have used the chatbot'
    },
    {
      title: 'Total Conversations',
      value: summary?.totalConversations || 0,
      icon: MessageSquare,
      description: 'Total conversations initiated'
    },
    {
      title: 'Unique Locations',
      value: summary?.uniqueLocations || 0,
      icon: MapPin,
      description: 'Different locations identified'
    },
    {
      title: 'Unique Industries',
      value: summary?.uniqueIndustries || 0,
      icon: Briefcase,
      description: 'Different industries identified'
    }
  ]

  /**
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-IN')
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        
        return (
          <Card key={stat.title} className="bg-[var(--card)] backdrop-blur-[8px] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {stat.title}
                  </p>
                  <p className="font-display text-3xl font-semibold text-[var(--foreground)]">
                    {formatNumber(stat.value)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {stat.description}
                  </p>
                </div>
                <div className="p-3 bg-[var(--accent)]/10 rounded-lg">
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
