'use client'

/**
 * Location Distribution Chart Component
 * 
 * Displays a bar chart showing the distribution of users by location.
 * 
 * Requirements: 1.4, 8.3
 * 
 * @module components/admin/charts/LocationDistributionChart
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MapPin } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface LocationDistributionChartProps {
  summary: AnalyticsSummary | null
  loading?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
]

// ============================================================================
// Component
// ============================================================================

export function LocationDistributionChart({ summary, loading = false }: LocationDistributionChartProps) {
  /**
   * Prepare chart data (top 10 locations)
   */
  const chartData = summary?.locationDistribution?.slice(0, 10).map((item) => ({
    name: item.location,
    value: item.userCount,
    percentage: item.percentage
  })) || []

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-[var(--card)] backdrop-blur-[8px] border border-[var(--border)] rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm text-[var(--foreground)]">{data.payload.name}</p>
          <div className="space-y-0.5 text-xs">
            <p className="text-[var(--muted-foreground)]">
              Users: <span className="font-medium text-[var(--foreground)]">{data.value}</span>
            </p>
            <p className="text-[var(--muted-foreground)]">
              Percentage: <span className="font-medium text-[var(--foreground)]">{data.payload.percentage.toFixed(1)}%</span>
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
            <MapPin className="h-5 w-5" />
            Location Distribution
          </CardTitle>
          <CardDescription>
            Distribution of users by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No location data available
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
          <MapPin className="h-5 w-5" />
          Location Distribution
        </CardTitle>
        <CardDescription>
          Top locations by user count
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="var(--muted-foreground)"
            />
            <YAxis className="text-xs" stroke="var(--muted-foreground)" />
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
