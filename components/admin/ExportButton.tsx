'use client'

/**
 * Export Button Component
 * 
 * Provides export functionality for analytics data:
 * - Export CSV button
 * - Export JSON button
 * - Anonymization checkbox option
 * - Loading state during export
 * - Error handling
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * @module components/admin/ExportButton
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileJson, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AnalyticsFilters } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface ExportButtonProps {
  filters?: AnalyticsFilters
}

// ============================================================================
// Component
// ============================================================================

export function ExportButton({ filters = {} }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [anonymize, setAnonymize] = useState(false)

  /**
   * Build query string from filters
   */
  const buildQueryString = (format: 'csv' | 'json'): string => {
    const params = new URLSearchParams()
    
    params.set('format', format)
    
    if (anonymize) {
      params.set('anonymize', 'true')
    }

    // Add filters
    if (filters.dateRange) {
      params.set('startDate', filters.dateRange.startDate)
      params.set('endDate', filters.dateRange.endDate)
    }

    if (filters.location) {
      params.set('location', filters.location)
    }

    if (filters.industry) {
      params.set('industry', filters.industry)
    }

    if (filters.schemeId) {
      params.set('schemeId', filters.schemeId)
    }

    if (filters.businessSize) {
      params.set('businessSize', filters.businessSize)
    }

    if (filters.languages && filters.languages.length > 0) {
      params.set('languages', filters.languages.join(','))
    }

    return params.toString()
  }

  /**
   * Download file from blob
   */
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Handle export
   */
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setLoading(true)

      const queryString = buildQueryString(format)
      const response = await fetch(`/api/admin/analytics/export?${queryString}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Export failed')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `analytics-export-${Date.now()}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download file
      const blob = await response.blob()
      downloadFile(blob, filename)

      toast.success(`Data exported successfully as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to export data. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Anonymization Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymize"
          checked={anonymize}
          onCheckedChange={(checked) => setAnonymize(checked as boolean)}
          disabled={loading}
        />
        <Label
          htmlFor="anonymize"
          className="text-sm font-normal cursor-pointer"
        >
          Anonymize data
        </Label>
      </div>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleExport('csv')}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleExport('json')}
            disabled={loading}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
