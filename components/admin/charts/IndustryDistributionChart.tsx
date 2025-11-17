'use client'

/**
 * Industry Distribution Chart Component
 * 
 * Displays a pie chart showing the distribution of users by industry.
 * 
 * Requirements: 1.5, 8.2
 * 
 * @module components/admin/charts/IndustryDistributionChart
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Briefcase } from 'lucide-react'
import type { AnalyticsSummary } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface IndustryDistributionChartProps {
  summary: AnalyticsSummary | null
  loading?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
]

// ============================================================================
// Component
// ============================================================================

export function IndustryDistributionChart({ summary, loading = false }: IndustryDistributionChartProps) {
  /**
   * Prepare chart data
   */
  const chartData = summary?.industryDistribution?.map((item) => ({
    name: item.industry,
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
        <div className="bg-card border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold text-sm">{data.name}</p>
          <div className="space-y-0.5 text-xs">
            <p className="text-muted-foreground">
              Users: <span className="font-medium text-foreground">{data.value}</span>
            </p>
            <p className="text-muted-foreground">
              Percentage: <span className="font-medium text-foreground">{data.payload.percentage.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  /**
   * Custom label for pie chart
   */
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`
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
            <Briefcase className="h-5 w-5" />
            Industry Distribution
          </CardTitle>
          <CardDescription>
            Distribution of users by industry sector
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No industry data available
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
          <Briefcase className="h-5 w-5" />
          Industry Distribution
        </CardTitle>
        <CardDescription>
          Distribution of users by industry sector
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => {
                // Truncate long industry names in legend
                return value.length > 20 ? value.substring(0, 20) + '...' : value
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
