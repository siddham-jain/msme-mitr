'use client'

/**
 * Conversation Trend Chart Component
 * 
 * Displays a line chart showing conversation volume over time.
 * 
 * Requirements: 8.4
 * 
 * @module components/admin/charts/ConversationTrendChart
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface ConversationTrendChartProps {
  summary: AnalyticsSummary | null
  loading?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function ConversationTrendChart({ summary, loading = false }: ConversationTrendChartProps) {
  /**
   * Prepare chart data
   */
  const chartData = summary?.conversationTrend?.map((item) => ({
    date: formatDate(item.date),
    fullDate: item.date,
    value: item.conversationCount
  })) || []

  /**
   * Format date for display
   */
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-[var(--card)] backdrop-blur-[8px] border border-[var(--border)] rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm text-[var(--foreground)]">{data.payload.date}</p>
          <div className="space-y-0.5 text-xs">
            <p className="text-[var(--muted-foreground)]">
              Conversations: <span className="font-medium text-[var(--foreground)]">{data.value}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Conversation Trend
          </CardTitle>
          <CardDescription>
            Conversation volume over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No conversation trend data available
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversation Trend
        </CardTitle>
        <CardDescription>
          Conversation volume over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="var(--muted-foreground)"
            />
            <YAxis className="text-xs" stroke="var(--muted-foreground)" />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--accent)" 
              strokeWidth={2}
              dot={{ fill: 'var(--accent)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
