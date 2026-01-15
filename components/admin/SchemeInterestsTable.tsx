'use client'

/**
 * Scheme Interests Table Component
 * 
 * Displays table of schemes with interest metrics:
 * - Columns: scheme name, total interests, mentioned count, inquired count, detailed count
 * - Sorting by interest count
 * - Row click to view user details
 * - Trend indicator (up/down)
 * 
 * Requirements: 2.5
 * 
 * @module components/admin/SchemeInterestsTable
 */

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Languages
} from 'lucide-react'
import type { SchemeInterestWithDetails } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface SchemeInterestsTableProps {
  schemes: SchemeInterestWithDetails[]
  loading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type SortField = 'schemeName' | 'interestLevel' | 'mentionCount' | 'firstMentioned' | 'lastMentioned'
type SortDirection = 'asc' | 'desc' | null

// Aggregated scheme data for display
interface AggregatedScheme {
  schemeId: string
  schemeName: string
  ministry: string | null
  description: string | null
  category: string | null
  totalInterests: number
  mentionedCount: number
  inquiredCount: number
  detailedCount: number
  languages: string[]
  firstMentioned: string
  lastMentioned: string
  trend: 'up' | 'down' | 'stable'
}

// ============================================================================
// Component
// ============================================================================

export function SchemeInterestsTable({
  schemes,
  loading = false,
  currentPage,
  totalPages,
  onPageChange
}: SchemeInterestsTableProps) {
  // State
  const [sortField, setSortField] = useState<SortField | null>('mentionCount')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedScheme, setSelectedScheme] = useState<AggregatedScheme | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  /**
   * Aggregate scheme interests by scheme
   */
  const aggregateSchemes = (): AggregatedScheme[] => {
    const schemeMap = new Map<string, AggregatedScheme>()

    schemes.forEach((interest) => {
      const schemeId = interest.scheme_id
      const schemeName = interest.scheme?.scheme_name || 'Unknown Scheme'

      if (!schemeMap.has(schemeId)) {
        schemeMap.set(schemeId, {
          schemeId,
          schemeName,
          ministry: interest.scheme?.ministry || null,
          description: interest.scheme?.description || null,
          category: interest.scheme?.category || null,
          totalInterests: 0,
          mentionedCount: 0,
          inquiredCount: 0,
          detailedCount: 0,
          languages: [],
          firstMentioned: interest.first_mentioned_at,
          lastMentioned: interest.last_mentioned_at,
          trend: 'stable'
        })
      }

      const scheme = schemeMap.get(schemeId)!
      scheme.totalInterests++

      // Count by interest level
      if (interest.interest_level === 'mentioned') {
        scheme.mentionedCount++
      } else if (interest.interest_level === 'inquired') {
        scheme.inquiredCount++
      } else if (interest.interest_level === 'detailed') {
        scheme.detailedCount++
      }

      // Collect languages
      if (interest.mentioned_in_languages) {
        interest.mentioned_in_languages.forEach((lang) => {
          if (!scheme.languages.includes(lang)) {
            scheme.languages.push(lang)
          }
        })
      }

      // Update first/last mentioned dates
      if (interest.first_mentioned_at < scheme.firstMentioned) {
        scheme.firstMentioned = interest.first_mentioned_at
      }
      if (interest.last_mentioned_at > scheme.lastMentioned) {
        scheme.lastMentioned = interest.last_mentioned_at
      }
    })

    // Calculate trends (simple heuristic: more detailed interests = trending up)
    schemeMap.forEach((scheme) => {
      const detailedRatio = scheme.detailedCount / scheme.totalInterests
      const mentionedRatio = scheme.mentionedCount / scheme.totalInterests

      if (detailedRatio > 0.3) {
        scheme.trend = 'up'
      } else if (mentionedRatio > 0.7) {
        scheme.trend = 'down'
      } else {
        scheme.trend = 'stable'
      }
    })

    return Array.from(schemeMap.values())
  }

  /**
   * Handle column sort
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  /**
   * Get sorted schemes
   */
  const getSortedSchemes = () => {
    const aggregated = aggregateSchemes()

    if (!sortField || !sortDirection) {
      return aggregated
    }

    return [...aggregated].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'schemeName':
          aValue = a.schemeName
          bValue = b.schemeName
          break
        case 'interestLevel':
          // Sort by detailed count (higher interest level)
          aValue = a.detailedCount
          bValue = b.detailedCount
          break
        case 'mentionCount':
          aValue = a.totalInterests
          bValue = b.totalInterests
          break
        case 'firstMentioned':
          aValue = a.firstMentioned
          bValue = b.firstMentioned
          break
        case 'lastMentioned':
          aValue = a.lastMentioned
          bValue = b.lastMentioned
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * Render sort icon
   */
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />
    }
    return <ArrowDown className="h-4 w-4 ml-1" />
  }

  /**
   * Render trend indicator
   */
  const renderTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Trending
        </Badge>
      )
    } else if (trend === 'down') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          Declining
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Minus className="h-3 w-3" />
          Stable
        </Badge>
      )
    }
  }

  /**
   * Get interest level color
   */
  const getInterestLevelColor = (count: number, total: number) => {
    const ratio = count / total
    if (ratio > 0.5) return 'text-green-600 font-semibold'
    if (ratio > 0.3) return 'text-blue-600 font-medium'
    return 'text-muted-foreground'
  }

  /**
   * Handle row click
   */
  const handleRowClick = (scheme: AggregatedScheme) => {
    setSelectedScheme(scheme)
    setDetailsOpen(true)
  }

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheme Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  /**
   * Render empty state
   */
  if (schemes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheme Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scheme interests found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedSchemes = getSortedSchemes()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scheme Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[var(--border)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('schemeName')}
                      className="flex items-center"
                    >
                      Scheme Name
                      {renderSortIcon('schemeName')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('mentionCount')}
                      className="flex items-center"
                    >
                      Total Interests
                      {renderSortIcon('mentionCount')}
                    </Button>
                  </TableHead>
                  <TableHead>Mentioned</TableHead>
                  <TableHead>Inquired</TableHead>
                  <TableHead>Detailed</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('lastMentioned')}
                      className="flex items-center"
                    >
                      Last Activity
                      {renderSortIcon('lastMentioned')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSchemes.map((scheme) => (
                  <TableRow
                    key={scheme.schemeId}
                    onClick={() => handleRowClick(scheme)}
                    className="cursor-pointer hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)]"
                  >
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <div className="font-semibold">{scheme.schemeName}</div>
                        {scheme.ministry && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {scheme.ministry}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="font-semibold">
                        {scheme.totalInterests}
                      </Badge>
                    </TableCell>
                    <TableCell className={getInterestLevelColor(scheme.mentionedCount, scheme.totalInterests)}>
                      {scheme.mentionedCount}
                    </TableCell>
                    <TableCell className={getInterestLevelColor(scheme.inquiredCount, scheme.totalInterests)}>
                      {scheme.inquiredCount}
                    </TableCell>
                    <TableCell className={getInterestLevelColor(scheme.detailedCount, scheme.totalInterests)}>
                      {scheme.detailedCount}
                    </TableCell>
                    <TableCell>
                      {renderTrendIndicator(scheme.trend)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(scheme.lastMentioned).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheme Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scheme Interest Details</DialogTitle>
            <DialogDescription>
              Detailed metrics and information about scheme engagement
            </DialogDescription>
          </DialogHeader>
          {selectedScheme && (
            <div className="space-y-6">
              {/* Scheme Info */}
              <div>
                <h3 className="font-semibold mb-3">Scheme Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheme Name</p>
                    <p className="font-medium">{selectedScheme.schemeName}</p>
                  </div>
                  {selectedScheme.ministry && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ministry</p>
                      <p className="font-medium">{selectedScheme.ministry}</p>
                    </div>
                  )}
                  {selectedScheme.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <Badge variant="outline">{selectedScheme.category}</Badge>
                    </div>
                  )}
                  {selectedScheme.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {selectedScheme.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interest Metrics */}
              <div>
                <h3 className="font-semibold mb-3">Interest Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interests</p>
                    <p className="text-2xl font-bold">{selectedScheme.totalInterests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trend</p>
                    <div className="mt-1">
                      {renderTrendIndicator(selectedScheme.trend)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mentioned</p>
                    <p className="text-xl font-semibold text-muted-foreground">
                      {selectedScheme.mentionedCount}
                      <span className="text-sm ml-2">
                        ({Math.round((selectedScheme.mentionedCount / selectedScheme.totalInterests) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inquired</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {selectedScheme.inquiredCount}
                      <span className="text-sm ml-2">
                        ({Math.round((selectedScheme.inquiredCount / selectedScheme.totalInterests) * 100)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Detailed Interest</p>
                    <p className="text-xl font-semibold text-green-600">
                      {selectedScheme.detailedCount}
                      <span className="text-sm ml-2">
                        ({Math.round((selectedScheme.detailedCount / selectedScheme.totalInterests) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {selectedScheme.languages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Languages</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedScheme.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                        <Languages className="h-3 w-3" />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Mentioned</p>
                    <p className="text-sm">
                      {new Date(selectedScheme.firstMentioned).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="text-sm">
                      {new Date(selectedScheme.lastMentioned).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
