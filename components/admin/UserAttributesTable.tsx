'use client'

/**
 * User Attributes Table Component
 * 
 * Displays table of users with extracted attributes:
 * - Columns: user email, location, industry, business size, turnover, employees
 * - Sorting by column
 * - Row click to view details
 * - Detected languages badge
 * - Confidence score
 * 
 * Requirements: 2.2, 2.3, 2.4
 * 
 * @module components/admin/UserAttributesTable
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
  Users,
  Languages
} from 'lucide-react'
import type { UserAttributeWithUser } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface UserAttributesTableProps {
  users: UserAttributeWithUser[]
  loading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type SortField = 'email' | 'location' | 'industry' | 'businessSize' | 'annualTurnover' | 'employeeCount' | 'confidence'
type SortDirection = 'asc' | 'desc' | null

// ============================================================================
// Component
// ============================================================================

export function UserAttributesTable({
  users,
  loading = false,
  currentPage,
  totalPages,
  onPageChange
}: UserAttributesTableProps) {
  // State
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedUser, setSelectedUser] = useState<UserAttributeWithUser | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
   * Get sorted users
   */
  const getSortedUsers = () => {
    if (!sortField || !sortDirection) {
      return users
    }

    return [...users].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'email':
          aValue = a.user_email || ''
          bValue = b.user_email || ''
          break
        case 'location':
          aValue = a.location || ''
          bValue = b.location || ''
          break
        case 'industry':
          aValue = a.industry || ''
          bValue = b.industry || ''
          break
        case 'businessSize':
          aValue = a.business_size || ''
          bValue = b.business_size || ''
          break
        case 'annualTurnover':
          aValue = a.annual_turnover || 0
          bValue = b.annual_turnover || 0
          break
        case 'employeeCount':
          aValue = a.employee_count || 0
          bValue = b.employee_count || 0
          break
        case 'confidence':
          aValue = a.extraction_confidence || 0
          bValue = b.extraction_confidence || 0
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
   * Format currency
   */
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number | null | undefined) => {
    if (!confidence) return 'secondary'
    if (confidence >= 0.8) return 'default'
    if (confidence >= 0.6) return 'secondary'
    return 'outline'
  }

  /**
   * Handle row click
   */
  const handleRowClick = (user: UserAttributeWithUser) => {
    setSelectedUser(user)
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
            <Users className="h-5 w-5" />
            User Attributes
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
  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedUsers = getSortedUsers()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('email')}
                      className="flex items-center"
                    >
                      Email
                      {renderSortIcon('email')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('location')}
                      className="flex items-center"
                    >
                      Location
                      {renderSortIcon('location')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('industry')}
                      className="flex items-center"
                    >
                      Industry
                      {renderSortIcon('industry')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('businessSize')}
                      className="flex items-center"
                    >
                      Size
                      {renderSortIcon('businessSize')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('annualTurnover')}
                      className="flex items-center"
                    >
                      Turnover
                      {renderSortIcon('annualTurnover')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('employeeCount')}
                      className="flex items-center"
                    >
                      Employees
                      {renderSortIcon('employeeCount')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('confidence')}
                      className="flex items-center"
                    >
                      Confidence
                      {renderSortIcon('confidence')}
                    </Button>
                  </TableHead>
                  <TableHead>Languages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {user.user_email || 'Unknown'}
                    </TableCell>
                    <TableCell>{user.location || '-'}</TableCell>
                    <TableCell>{user.industry || '-'}</TableCell>
                    <TableCell>
                      {user.business_size ? (
                        <Badge variant="outline">{user.business_size}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(user.annual_turnover)}</TableCell>
                    <TableCell>{user.employee_count || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getConfidenceColor(user.extraction_confidence)}>
                        {user.extraction_confidence 
                          ? `${Math.round(user.extraction_confidence * 100)}%`
                          : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.detected_languages && user.detected_languages.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {user.detected_languages.slice(0, 2).map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                          {user.detected_languages.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.detected_languages.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
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

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Attribute Details</DialogTitle>
            <DialogDescription>
              Detailed information about extracted user attributes
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-8 py-2">
              {/* User Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base font-medium break-all">{selectedUser.user_email || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm break-all">{selectedUser.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Business Attributes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Business Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Location / Inquiry</p>
                    <p className="text-base font-medium">{selectedUser.location || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="text-base font-medium">{selectedUser.industry || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Business Size</p>
                    <p className="text-base font-medium">{selectedUser.business_size || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Annual Turnover</p>
                    <p className="text-base font-medium">{formatCurrency(selectedUser.annual_turnover)}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Employee Count</p>
                    <p className="text-base font-medium">{selectedUser.employee_count || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Extraction Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Extraction Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                    <div className="pt-1">
                      <Badge variant={getConfidenceColor(selectedUser.extraction_confidence)} className="text-sm px-3 py-1">
                        {selectedUser.extraction_confidence 
                          ? `${Math.round(selectedUser.extraction_confidence * 100)}%`
                          : '-'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Extraction Method</p>
                    <p className="text-base font-medium">{selectedUser.extraction_method || '-'}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Detected Languages</p>
                    {selectedUser.detected_languages && selectedUser.detected_languages.length > 0 ? (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {selectedUser.detected_languages.map((lang) => (
                          <Badge key={lang} variant="secondary" className="flex items-center gap-1.5 text-sm px-3 py-1">
                            <Languages className="h-3.5 w-3.5" />
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">No languages detected</p>
                    )}
                  </div>
                  {selectedUser.extraction_notes && (
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Extraction Notes</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedUser.extraction_notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-base">
                      {selectedUser.created_at 
                        ? new Date(selectedUser.created_at).toLocaleString()
                        : '-'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                    <p className="text-base">
                      {selectedUser.updated_at 
                        ? new Date(selectedUser.updated_at).toLocaleString()
                        : '-'}
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
