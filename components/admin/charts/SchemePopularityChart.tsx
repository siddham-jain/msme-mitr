'use client'

/**
 * Scheme Popularity Chart Component
 * 
 * Displays a bar chart showing the top 10 most popular schemes
 * based on user interest count.
 * 
 * Requirements: 1.3, 8.1
 * 
 * @module components/admin/charts/SchemePopularityChart
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface SchemePopularityChartProps {
  summary: AnalyticsSummary | null
  loading?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

// ============================================================================
// Component
// ============================================================================

export function SchemePopularityChart({ summary, loading = false }: SchemePopularityChartProps) {
  /**
   * Prepare chart data (top 10 schemes)
   */
  const chartData = summary?.topSchemes?.slice(0, 10).map((scheme) => ({
    name: scheme.schemeName.length > 30 
      ? scheme.schemeName.substring(0, 30) + '...' 
      : scheme.schemeName,
    fullName: scheme.schemeName,
    value: scheme.interestCount,
    mentioned: scheme.mentionedCount,
    inquired: scheme.inquiredCount,
    detailed: scheme.detailedCount
  })) || []

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm">{data.fullName}</p>
          <div className="space-y-0.5 text-xs">
            <p className="text-muted-foreground">
              Total Interest: <span className="font-medium text-foreground">{data.value}</span>
            </p>
            <p className="text-muted-foreground">
              Mentioned: <span className="font-medium text-foreground">{data.mentioned}</span>
            </p>
            <p className="text-muted-foreground">
              Inquired: <span className="font-medium text-foreground">{data.inquired}</span>
            </p>
            <p className="text-muted-foreground">
              Detailed: <span className="font-medium text-foreground">{data.detailed}</span>
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
            Top Schemes by Interest
          </CardTitle>
          <CardDescription>
            Most popular schemes based on user inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No scheme interest data available
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
          Top Schemes by Interest
        </CardTitle>
        <CardDescription>
          Most popular schemes based on user inquiries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
