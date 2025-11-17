'use client'

/**
 * Filter Panel Component
 * 
 * Provides filtering controls for analytics dashboard:
 * - Date range picker (start date, end date)
 * - Location dropdown filter
 * - Industry dropdown filter
 * - Scheme dropdown filter
 * - Apply and Clear Filters buttons
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @module components/admin/FilterPanel
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'
import type { AnalyticsFilters } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface FilterPanelProps {
  onFiltersChange: (filters: AnalyticsFilters) => void
  loading?: boolean
}

interface FilterOptions {
  locations: string[]
  industries: string[]
  schemes: Array<{ id: string; name: string }>
}

// ============================================================================
// Component
// ============================================================================

export function FilterPanel({ onFiltersChange, loading = false }: FilterPanelProps) {
  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [schemeId, setSchemeId] = useState('')
  const [businessSize, setBusinessSize] = useState<'Micro' | 'Small' | 'Medium' | ''>('')

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: [],
    industries: [],
    schemes: []
  })
  const [loadingOptions, setLoadingOptions] = useState(true)

  /**
   * Fetch filter options from API
   */
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingOptions(true)

        // Fetch locations, industries, and schemes
        // For now, we'll fetch from the summary endpoint without filters
        const response = await fetch('/api/admin/analytics/summary')
        
        if (!response.ok) {
          throw new Error('Failed to fetch filter options')
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          const { locationDistribution, industryDistribution } = result.data

          // Extract unique locations and industries
          const locations = locationDistribution
            .map((item: any) => item.location)
            .filter((loc: string) => loc && loc !== 'Unknown')
          
          const industries = industryDistribution
            .map((item: any) => item.industry)
            .filter((ind: string) => ind && ind !== 'Unknown')

          // Fetch schemes
          const schemesResponse = await fetch('/api/admin/analytics/schemes?pageSize=100')
          let schemes: Array<{ id: string; name: string }> = []
          
          if (schemesResponse.ok) {
            const schemesResult = await schemesResponse.json()
            if (schemesResult.success && schemesResult.data) {
              // Extract unique schemes from the interests data
              const schemeMap = new Map<string, string>()
              schemesResult.data.forEach((interest: any) => {
                if (interest.scheme_id && interest.scheme_name) {
                  schemeMap.set(interest.scheme_id, interest.scheme_name)
                }
              })
              schemes = Array.from(schemeMap.entries()).map(([id, name]) => ({ id, name }))
            }
          }

          setFilterOptions({
            locations,
            industries,
            schemes
          })
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchFilterOptions()
  }, [])

  /**
   * Handle apply filters
   */
  const handleApplyFilters = () => {
    const filters: AnalyticsFilters = {}

    // Date range
    if (startDate && endDate) {
      filters.dateRange = { startDate, endDate }
    }

    // Location
    if (location) {
      filters.location = location
    }

    // Industry
    if (industry) {
      filters.industry = industry
    }

    // Scheme
    if (schemeId) {
      filters.schemeId = schemeId
    }

    // Business size
    if (businessSize) {
      filters.businessSize = businessSize
    }

    onFiltersChange(filters)
  }

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setLocation('')
    setIndustry('')
    setSchemeId('')
    setBusinessSize('')
    onFiltersChange({})
  }

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return !!(startDate || endDate || location || industry || schemeId || businessSize)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select
            value={location}
            onValueChange={setLocation}
            disabled={loading || loadingOptions}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {filterOptions.locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry Filter */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={industry}
            onValueChange={setIndustry}
            disabled={loading || loadingOptions}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Industries</SelectItem>
              {filterOptions.industries.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scheme Filter */}
        <div className="space-y-2">
          <Label htmlFor="scheme">Scheme</Label>
          <Select
            value={schemeId}
            onValueChange={setSchemeId}
            disabled={loading || loadingOptions}
          >
            <SelectTrigger id="scheme">
              <SelectValue placeholder="Select scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Schemes</SelectItem>
              {filterOptions.schemes.map((scheme) => (
                <SelectItem key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Size Filter */}
        <div className="space-y-2">
          <Label htmlFor="businessSize">Business Size</Label>
          <Select
            value={businessSize}
            onValueChange={(value) => setBusinessSize(value as any)}
            disabled={loading}
          >
            <SelectTrigger id="businessSize">
              <SelectValue placeholder="Select business size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sizes</SelectItem>
              <SelectItem value="Micro">Micro</SelectItem>
              <SelectItem value="Small">Small</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex-1"
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            disabled={loading || !hasActiveFilters()}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
