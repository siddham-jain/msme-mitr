/**
 * Analytics Service
 * 
 * Aggregates and queries analytics data from user attributes and scheme interests.
 * Supports filtering, pagination, and data export functionality.
 */

import { createClient } from '@/lib/supabase/server';
import { getCacheService, generateCacheKey, generateFilterHash } from './cacheService';
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  UserAttribute,
  SchemeInterest,
  SchemeInterestWithDetails,
  PaginatedResult
} from '@/types/database';

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsServiceOptions {
  supabaseClient?: any;
  enableCache?: boolean;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ExportOptions {
  format: 'csv' | 'json';
  filters?: AnalyticsFilters;
  anonymize?: boolean;
}

// ============================================================================
// Analytics Service
// ============================================================================

export class AnalyticsService {
  private supabase: any;
  private cache: ReturnType<typeof getCacheService>;
  private enableCache: boolean;

  constructor(options?: AnalyticsServiceOptions) {
    this.supabase = options?.supabaseClient || createClient();
    this.cache = getCacheService();
    this.enableCache = options?.enableCache !== false; // Default to true
  }

  /**
   * Get analytics summary with aggregated data
   * Supports filtering by date range, location, industry, scheme, etc.
   */
  async getSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    try {
      console.log('[AnalyticsService] Getting summary with filters:', filters);

      // Check cache first
      if (this.enableCache) {
        const cacheKey = generateCacheKey('analytics:summary', { filters: generateFilterHash(filters) });
        const cached = await this.cache.get<AnalyticsSummary>(cacheKey);
        
        if (cached) {
          console.log('[AnalyticsService] Returning cached summary');
          return cached;
        }
      }

      // Build base query for user attributes
      let userAttributesQuery = this.supabase
        .from('user_attributes')
        .select('*', { count: 'exact' });

      // Apply filters to user attributes query
      userAttributesQuery = this.applyFiltersToQuery(userAttributesQuery, filters);

      // Execute user attributes query
      const { data: userAttributes, count: totalUsers, error: userError } = 
        await userAttributesQuery;

      if (userError) {
        console.error('[AnalyticsService] Error fetching user attributes:', userError);
        throw userError;
      }

      // Get total conversations count
      let conversationsQuery = this.supabase
        .from('conversations')
        .select('id', { count: 'exact' });

      // Apply date range filter to conversations
      if (filters?.dateRange) {
        conversationsQuery = conversationsQuery
          .gte('created_at', filters.dateRange.startDate)
          .lte('created_at', filters.dateRange.endDate);
      }

      const { count: totalConversations, error: convError } = 
        await conversationsQuery;

      if (convError) {
        console.error('[AnalyticsService] Error fetching conversations:', convError);
        throw convError;
      }

      // Get unique locations and industries from filtered data
      const uniqueLocations = new Set(
        userAttributes
          ?.filter((attr: UserAttribute) => attr.location)
          .map((attr: UserAttribute) => attr.location)
      ).size;

      const uniqueIndustries = new Set(
        userAttributes
          ?.filter((attr: UserAttribute) => attr.industry)
          .map((attr: UserAttribute) => attr.industry)
      ).size;

      // Get aggregated data
      const [
        topSchemes,
        locationDistribution,
        industryDistribution,
        conversationTrend,
        languageDistribution
      ] = await Promise.all([
        this.getTopSchemes(filters),
        this.getLocationDistribution(filters),
        this.getIndustryDistribution(filters),
        this.getConversationTrend(filters),
        this.getLanguageDistribution(filters)
      ]);

      const summary: AnalyticsSummary = {
        totalUsers: totalUsers || 0,
        totalConversations: totalConversations || 0,
        uniqueLocations,
        uniqueIndustries,
        topSchemes,
        locationDistribution,
        industryDistribution,
        conversationTrend,
        languageDistribution
      };

      // Cache the result
      if (this.enableCache) {
        const cacheKey = generateCacheKey('analytics:summary', { filters: generateFilterHash(filters) });
        await this.cache.set(cacheKey, summary, { ttl: 300 }); // 5 minutes
      }

      console.log('[AnalyticsService] Summary generated successfully');
      return summary;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get summary:', error);
      throw error;
    }
  }

  /**
   * Apply filters to a Supabase query
   */
  private applyFiltersToQuery(query: any, filters?: AnalyticsFilters): any {
    if (!filters) {
      return query;
    }

    // Date range filter (on created_at)
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.startDate)
        .lte('created_at', filters.dateRange.endDate);
    }

    // Location filter
    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    // Industry filter
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }

    // Business size filter
    if (filters.businessSize) {
      query = query.eq('business_size', filters.businessSize);
    }

    // Languages filter (array contains)
    if (filters.languages && filters.languages.length > 0) {
      query = query.contains('detected_languages', filters.languages);
    }

    return query;
  }

  /**
   * Apply filters to scheme interests query
   */
  private applySchemeFiltersToQuery(query: any, filters?: AnalyticsFilters): any {
    if (!filters) {
      return query;
    }

    // Date range filter
    if (filters.dateRange) {
      query = query
        .gte('first_mentioned_at', filters.dateRange.startDate)
        .lte('first_mentioned_at', filters.dateRange.endDate);
    }

    // Scheme filter
    if (filters.schemeId) {
      query = query.eq('scheme_id', filters.schemeId);
    }

    // Languages filter
    if (filters.languages && filters.languages.length > 0) {
      query = query.contains('mentioned_in_languages', filters.languages);
    }

    return query;
  }

  /**
   * Get top schemes by interest count
   */
  private async getTopSchemes(filters?: AnalyticsFilters): Promise<AnalyticsSummary['topSchemes']> {
    try {
      // Build query for scheme interests
      let query = this.supabase
        .from('scheme_interests')
        .select(`
          scheme_id,
          interest_level,
          schemes:scheme_id (
            id,
            scheme_name
          )
        `);

      // Apply filters
      query = this.applySchemeFiltersToQuery(query, filters);

      // If location/industry filters are provided, join with user_attributes
      if (filters?.location || filters?.industry || filters?.businessSize) {
        // Get filtered user IDs first
        let userQuery = this.supabase
          .from('user_attributes')
          .select('user_id');
        
        userQuery = this.applyFiltersToQuery(userQuery, filters);
        
        const { data: filteredUsers, error: userError } = await userQuery;
        if (userError) throw userError;

        const userIds = filteredUsers?.map((u: any) => u.user_id) || [];
        if (userIds.length === 0) {
          return [];
        }

        query = query.in('user_id', userIds);
      }

      const { data: schemeInterests, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching scheme interests:', error);
        throw error;
      }

      // Aggregate by scheme
      const schemeMap = new Map<string, {
        schemeId: string;
        schemeName: string;
        interestCount: number;
        mentionedCount: number;
        inquiredCount: number;
        detailedCount: number;
      }>();

      schemeInterests?.forEach((interest: any) => {
        const schemeId = interest.scheme_id;
        const schemeName = interest.schemes?.scheme_name || 'Unknown';

        if (!schemeMap.has(schemeId)) {
          schemeMap.set(schemeId, {
            schemeId,
            schemeName,
            interestCount: 0,
            mentionedCount: 0,
            inquiredCount: 0,
            detailedCount: 0
          });
        }

        const scheme = schemeMap.get(schemeId)!;
        scheme.interestCount++;

        if (interest.interest_level === 'mentioned') {
          scheme.mentionedCount++;
        } else if (interest.interest_level === 'inquired') {
          scheme.inquiredCount++;
        } else if (interest.interest_level === 'detailed') {
          scheme.detailedCount++;
        }
      });

      // Convert to array and sort by interest count
      const topSchemes = Array.from(schemeMap.values())
        .sort((a, b) => b.interestCount - a.interestCount)
        .slice(0, 10); // Top 10 schemes

      return topSchemes;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get top schemes:', error);
      return [];
    }
  }

  /**
   * Get location distribution
   */
  private async getLocationDistribution(
    filters?: AnalyticsFilters
  ): Promise<AnalyticsSummary['locationDistribution']> {
    try {
      let query = this.supabase
        .from('user_attributes')
        .select('location');

      query = this.applyFiltersToQuery(query, filters);

      const { data: userAttributes, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching locations:', error);
        throw error;
      }

      // Count by location
      const locationCounts = new Map<string, number>();
      let totalCount = 0;

      userAttributes?.forEach((attr: UserAttribute) => {
        if (attr.location) {
          locationCounts.set(attr.location, (locationCounts.get(attr.location) || 0) + 1);
          totalCount++;
        }
      });

      // Convert to array with percentages
      const distribution = Array.from(locationCounts.entries())
        .map(([location, userCount]) => ({
          location,
          userCount,
          percentage: totalCount > 0 ? (userCount / totalCount) * 100 : 0
        }))
        .sort((a, b) => b.userCount - a.userCount);

      return distribution;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get location distribution:', error);
      return [];
    }
  }

  /**
   * Get industry distribution
   */
  private async getIndustryDistribution(
    filters?: AnalyticsFilters
  ): Promise<AnalyticsSummary['industryDistribution']> {
    try {
      let query = this.supabase
        .from('user_attributes')
        .select('industry');

      query = this.applyFiltersToQuery(query, filters);

      const { data: userAttributes, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching industries:', error);
        throw error;
      }

      // Count by industry
      const industryCounts = new Map<string, number>();
      let totalCount = 0;

      userAttributes?.forEach((attr: UserAttribute) => {
        if (attr.industry) {
          industryCounts.set(attr.industry, (industryCounts.get(attr.industry) || 0) + 1);
          totalCount++;
        }
      });

      // Convert to array with percentages
      const distribution = Array.from(industryCounts.entries())
        .map(([industry, userCount]) => ({
          industry,
          userCount,
          percentage: totalCount > 0 ? (userCount / totalCount) * 100 : 0
        }))
        .sort((a, b) => b.userCount - a.userCount);

      return distribution;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get industry distribution:', error);
      return [];
    }
  }

  /**
   * Get conversation trend over time
   */
  private async getConversationTrend(
    filters?: AnalyticsFilters
  ): Promise<AnalyticsSummary['conversationTrend']> {
    try {
      let query = this.supabase
        .from('conversations')
        .select('created_at')
        .order('created_at', { ascending: true });

      // Apply date range filter
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.startDate)
          .lte('created_at', filters.dateRange.endDate);
      }

      const { data: conversations, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching conversations:', error);
        throw error;
      }

      // Group by date
      const dateCounts = new Map<string, number>();

      conversations?.forEach((conv: any) => {
        const date = new Date(conv.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
        dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
      });

      // Convert to array
      const trend = Array.from(dateCounts.entries())
        .map(([date, conversationCount]) => ({
          date,
          conversationCount
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trend;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get conversation trend:', error);
      return [];
    }
  }

  /**
   * Get language distribution
   */
  private async getLanguageDistribution(
    filters?: AnalyticsFilters
  ): Promise<AnalyticsSummary['languageDistribution']> {
    try {
      let query = this.supabase
        .from('user_attributes')
        .select('detected_languages');

      query = this.applyFiltersToQuery(query, filters);

      const { data: userAttributes, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching languages:', error);
        throw error;
      }

      // Count by language
      const languageCounts = new Map<string, number>();
      let totalCount = 0;

      userAttributes?.forEach((attr: UserAttribute) => {
        if (attr.detected_languages && Array.isArray(attr.detected_languages)) {
          attr.detected_languages.forEach((lang: string) => {
            languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
          });
          totalCount++;
        }
      });

      // Convert to array with percentages
      const distribution = Array.from(languageCounts.entries())
        .map(([language, userCount]) => ({
          language,
          userCount,
          percentage: totalCount > 0 ? (userCount / totalCount) * 100 : 0
        }))
        .sort((a, b) => b.userCount - a.userCount);

      return distribution;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get language distribution:', error);
      return [];
    }
  }

  /**
   * Get user attributes with filters and pagination
   */
  async getUserAttributes(
    filters?: AnalyticsFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<PaginatedResult<UserAttribute>> {
    try {
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      console.log('[AnalyticsService] Getting user attributes:', { filters, pagination, sort });

      // Build query
      let query = this.supabase
        .from('user_attributes')
        .select('*', { count: 'exact' });

      // Apply filters
      query = this.applyFiltersToQuery(query, filters);

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching user attributes:', error);
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalCount: count || 0,
          totalPages
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to get user attributes:', error);
      throw error;
    }
  }

  /**
   * Get scheme interests with filters and pagination
   */
  async getSchemeInterests(
    filters?: AnalyticsFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<PaginatedResult<SchemeInterestWithDetails>> {
    try {
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 20;
      const offset = (page - 1) * pageSize;

      console.log('[AnalyticsService] Getting scheme interests:', { filters, pagination, sort });

      // Build query with scheme details
      let query = this.supabase
        .from('scheme_interests')
        .select(`
          *,
          scheme:schemes (
            id,
            scheme_name,
            ministry,
            description,
            category
          )
        `, { count: 'exact' });

      // Apply filters
      query = this.applySchemeFiltersToQuery(query, filters);

      // If location/industry filters are provided, join with user_attributes
      if (filters?.location || filters?.industry || filters?.businessSize) {
        // Get filtered user IDs first
        let userQuery = this.supabase
          .from('user_attributes')
          .select('user_id');
        
        userQuery = this.applyFiltersToQuery(userQuery, filters);
        
        const { data: filteredUsers, error: userError } = await userQuery;
        if (userError) throw userError;

        const userIds = filteredUsers?.map((u: any) => u.user_id) || [];
        if (userIds.length === 0) {
          return {
            data: [],
            pagination: {
              page,
              pageSize,
              totalCount: 0,
              totalPages: 0
            }
          };
        }

        query = query.in('user_id', userIds);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by last_mentioned_at descending
        query = query.order('last_mentioned_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('[AnalyticsService] Error fetching scheme interests:', error);
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalCount: count || 0,
          totalPages
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to get scheme interests:', error);
      throw error;
    }
  }

  /**
   * Get filter options (unique values for dropdowns)
   */
  async getFilterOptions(): Promise<{
    locations: string[];
    industries: string[];
    schemes: Array<{ id: string; name: string }>;
    languages: string[];
  }> {
    try {
      console.log('[AnalyticsService] Getting filter options');

      // Check cache first
      if (this.enableCache) {
        const cacheKey = 'analytics:filter-options';
        const cached = await this.cache.get<{
          locations: string[];
          industries: string[];
          schemes: Array<{ id: string; name: string }>;
          languages: string[];
        }>(cacheKey);
        
        if (cached) {
          console.log('[AnalyticsService] Returning cached filter options');
          return cached;
        }
      }

      // Get unique locations
      const { data: locationData } = await this.supabase
        .from('user_attributes')
        .select('location')
        .not('location', 'is', null);

      const locations = Array.from(
        new Set(locationData?.map((item: any) => item.location).filter(Boolean))
      ).sort() as string[];

      // Get unique industries
      const { data: industryData } = await this.supabase
        .from('user_attributes')
        .select('industry')
        .not('industry', 'is', null);

      const industries = Array.from(
        new Set(industryData?.map((item: any) => item.industry).filter(Boolean))
      ).sort() as string[];

      // Get active schemes
      const { data: schemeData } = await this.supabase
        .from('schemes')
        .select('id, scheme_name')
        .eq('is_active', true)
        .order('scheme_name');

      const schemes = schemeData?.map((scheme: any) => ({
        id: scheme.id,
        name: scheme.scheme_name
      })) || [];

      // Get unique languages
      const { data: languageData } = await this.supabase
        .from('user_attributes')
        .select('detected_languages')
        .not('detected_languages', 'is', null);

      const languageSet = new Set<string>();
      languageData?.forEach((item: any) => {
        if (Array.isArray(item.detected_languages)) {
          item.detected_languages.forEach((lang: string) => languageSet.add(lang));
        }
      });
      const languages = Array.from(languageSet).sort();

      const filterOptions = {
        locations,
        industries,
        schemes,
        languages
      };

      // Cache the result
      if (this.enableCache) {
        const cacheKey = 'analytics:filter-options';
        await this.cache.set(cacheKey, filterOptions, { ttl: 300 }); // 5 minutes
      }

      return filterOptions;
    } catch (error) {
      console.error('[AnalyticsService] Failed to get filter options:', error);
      return {
        locations: [],
        industries: [],
        schemes: [],
        languages: []
      };
    }
  }

  /**
   * Export analytics data in CSV or JSON format
   */
  async exportData(options: ExportOptions): Promise<string> {
    try {
      console.log('[AnalyticsService] Exporting data:', options);

      // Fetch all data (no pagination for export)
      const { data: userAttributes } = await this.getUserAttributes(
        options.filters,
        { page: 1, pageSize: 10000 } // Large page size for export
      );

      const { data: schemeInterests } = await this.getSchemeInterests(
        options.filters,
        { page: 1, pageSize: 10000 }
      );

      // Anonymize if requested
      const processedUserAttributes = options.anonymize
        ? this.anonymizeUserAttributes(userAttributes)
        : userAttributes;

      const processedSchemeInterests = options.anonymize
        ? this.anonymizeSchemeInterests(schemeInterests)
        : schemeInterests;

      // Generate export based on format
      if (options.format === 'csv') {
        return this.generateCSV(processedUserAttributes, processedSchemeInterests);
      } else {
        return this.generateJSON(processedUserAttributes, processedSchemeInterests);
      }
    } catch (error) {
      console.error('[AnalyticsService] Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Anonymize user attributes for export
   */
  private anonymizeUserAttributes(attributes: UserAttribute[]): UserAttribute[] {
    return attributes.map(attr => ({
      ...attr,
      user_id: this.hashUserId(attr.user_id),
      conversation_id: attr.conversation_id ? this.hashUserId(attr.conversation_id) : null,
      extracted_from_message_id: null, // Remove message reference
      is_anonymized: true
    }));
  }

  /**
   * Anonymize scheme interests for export
   */
  private anonymizeSchemeInterests(interests: SchemeInterestWithDetails[]): SchemeInterestWithDetails[] {
    return interests.map(interest => ({
      ...interest,
      user_id: this.hashUserId(interest.user_id),
      conversation_id: interest.conversation_id ? this.hashUserId(interest.conversation_id) : null,
      extracted_from_message_id: null,
      is_anonymized: true
    }));
  }

  /**
   * Hash user ID for anonymization
   */
  private hashUserId(userId: string): string {
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Generate CSV export
   */
  private generateCSV(
    userAttributes: UserAttribute[],
    schemeInterests: SchemeInterestWithDetails[]
  ): string {
    const lines: string[] = [];

    // User Attributes Section
    lines.push('USER ATTRIBUTES');
    lines.push('');
    
    // CSV headers for user attributes
    const userHeaders = [
      'User ID',
      'Location',
      'Industry',
      'Business Size',
      'Annual Turnover',
      'Employee Count',
      'Languages',
      'Confidence',
      'Created At'
    ];
    lines.push(userHeaders.join(','));

    // User attribute rows
    userAttributes.forEach(attr => {
      const row = [
        this.escapeCsvValue(attr.user_id),
        this.escapeCsvValue(attr.location || ''),
        this.escapeCsvValue(attr.industry || ''),
        this.escapeCsvValue(attr.business_size || ''),
        attr.annual_turnover || '',
        attr.employee_count || '',
        this.escapeCsvValue(attr.detected_languages?.join('; ') || ''),
        attr.extraction_confidence,
        this.escapeCsvValue(attr.created_at)
      ];
      lines.push(row.join(','));
    });

    lines.push('');
    lines.push('');

    // Scheme Interests Section
    lines.push('SCHEME INTERESTS');
    lines.push('');

    // CSV headers for scheme interests
    const schemeHeaders = [
      'User ID',
      'Scheme Name',
      'Ministry',
      'Interest Level',
      'Mention Count',
      'Languages',
      'First Mentioned',
      'Last Mentioned'
    ];
    lines.push(schemeHeaders.join(','));

    // Scheme interest rows
    schemeInterests.forEach(interest => {
      const row = [
        this.escapeCsvValue(interest.user_id),
        this.escapeCsvValue(interest.scheme?.scheme_name || 'Unknown'),
        this.escapeCsvValue(interest.scheme?.ministry || ''),
        this.escapeCsvValue(interest.interest_level),
        interest.mention_count,
        this.escapeCsvValue(interest.mentioned_in_languages?.join('; ') || ''),
        this.escapeCsvValue(interest.first_mentioned_at),
        this.escapeCsvValue(interest.last_mentioned_at)
      ];
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private escapeCsvValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Generate JSON export
   */
  private generateJSON(
    userAttributes: UserAttribute[],
    schemeInterests: SchemeInterestWithDetails[]
  ): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalUserAttributes: userAttributes.length,
        totalSchemeInterests: schemeInterests.length
      },
      userAttributes,
      schemeInterests
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Anonymize user data (mark as anonymized in database)
   */
  async anonymizeUserData(userId: string): Promise<boolean> {
    try {
      console.log('[AnalyticsService] Anonymizing user data:', userId);

      const now = new Date().toISOString();

      // Anonymize user attributes
      const { error: attrError } = await this.supabase
        .from('user_attributes')
        .update({
          is_anonymized: true,
          anonymized_at: now
        })
        .eq('user_id', userId);

      if (attrError) {
        console.error('[AnalyticsService] Error anonymizing user attributes:', attrError);
        throw attrError;
      }

      // Anonymize scheme interests
      const { error: interestError } = await this.supabase
        .from('scheme_interests')
        .update({
          is_anonymized: true
        })
        .eq('user_id', userId);

      if (interestError) {
        console.error('[AnalyticsService] Error anonymizing scheme interests:', interestError);
        throw interestError;
      }

      console.log('[AnalyticsService] User data anonymized successfully');
      return true;
    } catch (error) {
      console.error('[AnalyticsService] Failed to anonymize user data:', error);
      return false;
    }
  }

  /**
   * Invalidate analytics cache
   * Call this after new extractions are completed
   */
  async invalidateCache(): Promise<void> {
    try {
      console.log('[AnalyticsService] Invalidating analytics cache');
      
      // Clear all analytics-related cache entries
      await this.cache.deletePattern('analytics:*');
      
      console.log('[AnalyticsService] Cache invalidated successfully');
    } catch (error) {
      console.error('[AnalyticsService] Failed to invalidate cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getStats();
  }
}
