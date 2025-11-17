/**
 * Multilingual Extraction Service
 * 
 * Extracts structured business information from MSME conversations
 * with support for Hindi, English, Hinglish, and regional languages.
 */

import { createClient } from '@/lib/supabase/server';
import { MessageService } from '@/services/database/messageService';
import { ConversationService } from '@/services/database/conversationService';
import { buildExtractionPrompt } from '@/lib/prompts/extractionPrompt';
import {
  normalizeLocation,
  normalizeIndustry,
  normalizeCurrency,
  normalizeBusinessSize,
  normalizeEmployeeCount,
  detectConversationLanguages
} from '@/lib/utils/normalization';
import type {
  UserAttributeInsert,
  SchemeInterestInsert,
  ExtractionJobUpdate,
  Message,
  Scheme
} from '@/types/database';
import OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

interface ExtractionResult {
  attributes: {
    location?: string | null;
    industry?: string | null;
    businessSize?: 'Micro' | 'Small' | 'Medium' | null;
    annualTurnover?: number | null;
    employeeCount?: number | null;
  };
  schemeInterests: Array<{
    schemeName: string;
    interestLevel: 'mentioned' | 'inquired' | 'detailed';
  }>;
  metadata: {
    confidence: number;
    detectedLanguages: string[];
    extractionNotes: string;
    originalLanguageData?: any;
  };
}

interface RawExtractionResponse {
  location?: string | null;
  industry?: string | null;
  businessSize?: 'Micro' | 'Small' | 'Medium' | null;
  annualTurnover?: number | null;
  employeeCount?: number | null;
  schemeInterests?: Array<{
    schemeName: string;
    interestLevel: 'mentioned' | 'inquired' | 'detailed';
  }>;
  confidence: number;
  extractionNotes: string;
  detectedLanguages: string[];
}

// ============================================================================
// Extraction Service
// ============================================================================

export class ExtractionService {
  private supabase: any;
  private messageService: MessageService;
  private conversationService: ConversationService;
  private openaiClient: OpenAI | null = null;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.messageService = new MessageService(this.supabase);
    this.conversationService = new ConversationService(this.supabase);

    // Initialize OpenRouter client
    if (process.env.OPENROUTER_API_KEY) {
      this.openaiClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'MSME Mitr - Analytics Extraction',
        }
      });
    }
  }

  /**
   * Extract attributes from a conversation with multilingual support
   * Main entry point for extraction
   */
  async extractFromConversation(conversationId: string): Promise<ExtractionResult> {
    try {
      console.log(`[ExtractionService] Starting extraction for conversation: ${conversationId}`);

      // Load conversation messages with full history
      const messages = await this.messageService.getMessages(conversationId);

      if (messages.length === 0) {
        throw new Error('No messages found in conversation');
      }

      console.log(`[ExtractionService] Loaded ${messages.length} messages`);

      // Build conversation context for AI analysis
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Detect languages used in conversation
      const detectedLanguages = detectConversationLanguages(conversationHistory);
      console.log(`[ExtractionService] Detected languages:`, detectedLanguages);

      // Perform AI extraction
      const rawExtraction = await this.performAIExtraction(conversationHistory);

      // Normalize extracted data
      const normalizedResult = this.normalizeExtractionResult(rawExtraction, detectedLanguages);

      console.log(`[ExtractionService] Extraction completed with confidence: ${normalizedResult.metadata.confidence}`);

      return normalizedResult;
    } catch (error) {
      console.error('[ExtractionService] Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Perform AI extraction using OpenRouter
   */
  private async performAIExtraction(
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<RawExtractionResponse> {
    if (!this.openaiClient) {
      console.warn('[ExtractionService] OpenRouter not configured, using fallback');
      return this.fallbackExtraction(conversationHistory);
    }

    try {
      const prompt = buildExtractionPrompt(conversationHistory);
      const model = process.env.EXTRACTION_MODEL || 'openai/gpt-4o-mini';

      console.log(`[ExtractionService] Calling AI model: ${model}`);

      const response = await this.openaiClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent extraction
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);
      console.log('[ExtractionService] AI extraction successful');

      return parsed as RawExtractionResponse;
    } catch (error) {
      console.error('[ExtractionService] AI extraction failed:', error);
      
      // Retry with fallback model
      if (error instanceof Error && error.message.includes('model')) {
        console.log('[ExtractionService] Retrying with fallback model');
        try {
          const prompt = buildExtractionPrompt(conversationHistory);
          const response = await this.openaiClient!.chat.completions.create({
            model: 'anthropic/claude-3-haiku',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]) as RawExtractionResponse;
            }
          }
        } catch (retryError) {
          console.error('[ExtractionService] Retry failed:', retryError);
        }
      }

      // Use fallback extraction
      return this.fallbackExtraction(conversationHistory);
    }
  }

  /**
   * Fallback extraction using rule-based approach
   */
  private fallbackExtraction(
    conversationHistory: Array<{ role: string; content: string }>
  ): RawExtractionResponse {
    console.log('[ExtractionService] Using fallback rule-based extraction');

    const allText = conversationHistory
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    const result: RawExtractionResponse = {
      location: null,
      industry: null,
      businessSize: null,
      annualTurnover: null,
      employeeCount: null,
      schemeInterests: [],
      confidence: 0.4, // Lower confidence for fallback
      extractionNotes: 'Extracted using fallback rule-based method',
      detectedLanguages: detectConversationLanguages(conversationHistory)
    };

    // Simple keyword-based extraction
    // Location detection
    const cities = ['mumbai', 'delhi', 'bangalore', 'pune', 'chennai', 'hyderabad', 'kolkata'];
    for (const city of cities) {
      if (allText.includes(city)) {
        result.location = city;
        break;
      }
    }

    // Industry detection
    if (allText.includes('textile') || allText.includes('kapde') || allText.includes('कपड़े')) {
      result.industry = 'textiles';
    } else if (allText.includes('food') || allText.includes('restaurant') || allText.includes('खाना')) {
      result.industry = 'food';
    } else if (allText.includes('retail') || allText.includes('shop') || allText.includes('dukaan')) {
      result.industry = 'retail';
    }

    // Business size detection
    if (allText.includes('small') || allText.includes('chota') || allText.includes('छोटा')) {
      result.businessSize = 'Micro';
    }

    return result;
  }

  /**
   * Normalize extraction result to standard format
   */
  private normalizeExtractionResult(
    raw: RawExtractionResponse,
    detectedLanguages: string[]
  ): ExtractionResult {
    // Normalize location
    const location = normalizeLocation(raw.location);

    // Normalize industry
    const industry = normalizeIndustry(raw.industry);

    // Normalize business size (considering employee count and turnover)
    const businessSize = normalizeBusinessSize(
      raw.businessSize,
      raw.employeeCount,
      raw.annualTurnover
    );

    // Store original language data if different from normalized
    const originalLanguageData: any = {};
    if (raw.location && raw.location !== location) {
      originalLanguageData.location = raw.location;
    }
    if (raw.industry && raw.industry !== industry) {
      originalLanguageData.industry = raw.industry;
    }

    return {
      attributes: {
        location,
        industry,
        businessSize,
        annualTurnover: raw.annualTurnover,
        employeeCount: raw.employeeCount
      },
      schemeInterests: raw.schemeInterests || [],
      metadata: {
        confidence: raw.confidence,
        detectedLanguages: raw.detectedLanguages || detectedLanguages,
        extractionNotes: raw.extractionNotes,
        originalLanguageData: Object.keys(originalLanguageData).length > 0 
          ? originalLanguageData 
          : undefined
      }
    };
  }

  /**
   * Match scheme mentions in conversation and determine interest level
   */
  async matchSchemeInterests(
    schemeInterests: Array<{ schemeName: string; interestLevel: string }>,
    conversationId: string
  ): Promise<Array<{ schemeId: string; interestLevel: 'mentioned' | 'inquired' | 'detailed' }>> {
    if (schemeInterests.length === 0) {
      return [];
    }

    try {
      // Load all schemes from database
      const { data: schemes, error } = await this.supabase
        .from('schemes')
        .select('id, scheme_name')
        .eq('is_active', true);

      if (error) {
        console.error('[ExtractionService] Failed to load schemes:', error);
        return [];
      }

      const matched: Array<{ schemeId: string; interestLevel: 'mentioned' | 'inquired' | 'detailed' }> = [];

      // Match each extracted scheme interest with database schemes
      for (const interest of schemeInterests) {
        const schemeName = interest.schemeName.toLowerCase();

        // Find matching scheme (fuzzy match)
        const matchedScheme = schemes.find((scheme: Scheme) => {
          const dbName = scheme.scheme_name.toLowerCase();
          return dbName.includes(schemeName) || schemeName.includes(dbName);
        });

        if (matchedScheme) {
          matched.push({
            schemeId: matchedScheme.id,
            interestLevel: interest.interestLevel as 'mentioned' | 'inquired' | 'detailed'
          });
        }
      }

      console.log(`[ExtractionService] Matched ${matched.length} scheme interests`);
      return matched;
    } catch (error) {
      console.error('[ExtractionService] Scheme matching failed:', error);
      return [];
    }
  }

  /**
   * Store extraction results in database
   */
  async storeExtractionResults(
    conversationId: string,
    userId: string,
    extractionResult: ExtractionResult,
    jobId: string
  ): Promise<void> {
    try {
      console.log(`[ExtractionService] Storing extraction results for conversation: ${conversationId}`);

      // Only store if confidence is above threshold
      const confidenceThreshold = parseFloat(process.env.EXTRACTION_CONFIDENCE_THRESHOLD || '0.5');
      if (extractionResult.metadata.confidence < confidenceThreshold) {
        console.log(`[ExtractionService] Confidence ${extractionResult.metadata.confidence} below threshold ${confidenceThreshold}, skipping storage`);
        
        // Mark job as completed but with low confidence
        await this.updateExtractionJob(jobId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          error_message: `Low confidence: ${extractionResult.metadata.confidence}`
        });
        return;
      }

      // Check if user attributes already exist
      const { data: existingAttributes } = await this.supabase
        .from('user_attributes')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      // Prepare user attributes data
      const attributesData: UserAttributeInsert = {
        user_id: userId,
        conversation_id: conversationId,
        location: extractionResult.attributes.location,
        industry: extractionResult.attributes.industry,
        business_size: extractionResult.attributes.businessSize,
        annual_turnover: extractionResult.attributes.annualTurnover,
        employee_count: extractionResult.attributes.employeeCount,
        detected_languages: extractionResult.metadata.detectedLanguages,
        original_language_data: extractionResult.metadata.originalLanguageData,
        extraction_confidence: extractionResult.metadata.confidence,
        extraction_method: 'ai',
        extraction_notes: extractionResult.metadata.extractionNotes
      };

      // Insert or update user attributes
      if (existingAttributes) {
        // Update only if new confidence is higher
        if (extractionResult.metadata.confidence > existingAttributes.extraction_confidence) {
          const { error } = await this.supabase
            .from('user_attributes')
            .update(attributesData)
            .eq('id', existingAttributes.id);

          if (error) {
            console.error('[ExtractionService] Failed to update user attributes:', error);
          } else {
            console.log('[ExtractionService] Updated user attributes with higher confidence');
          }
        } else {
          console.log('[ExtractionService] Existing attributes have higher confidence, skipping update');
        }
      } else {
        // Insert new attributes
        const { error } = await this.supabase
          .from('user_attributes')
          .insert(attributesData);

        if (error) {
          console.error('[ExtractionService] Failed to insert user attributes:', error);
        } else {
          console.log('[ExtractionService] Inserted new user attributes');
        }
      }

      // Match and store scheme interests
      const matchedSchemes = await this.matchSchemeInterests(
        extractionResult.schemeInterests,
        conversationId
      );

      for (const scheme of matchedSchemes) {
        // Check if scheme interest already exists
        const { data: existingInterest } = await this.supabase
          .from('scheme_interests')
          .select('*')
          .eq('user_id', userId)
          .eq('scheme_id', scheme.schemeId)
          .maybeSingle();

        if (existingInterest) {
          // Update existing interest
          const { error } = await this.supabase
            .from('scheme_interests')
            .update({
              interest_level: scheme.interestLevel,
              last_mentioned_at: new Date().toISOString(),
              mention_count: existingInterest.mention_count + 1,
              mentioned_in_languages: Array.from(new Set([
                ...(existingInterest.mentioned_in_languages || []),
                ...extractionResult.metadata.detectedLanguages
              ]))
            })
            .eq('id', existingInterest.id);

          if (error) {
            console.error('[ExtractionService] Failed to update scheme interest:', error);
          }
        } else {
          // Insert new scheme interest
          const interestData: SchemeInterestInsert = {
            user_id: userId,
            scheme_id: scheme.schemeId,
            conversation_id: conversationId,
            interest_level: scheme.interestLevel,
            mentioned_in_languages: extractionResult.metadata.detectedLanguages
          };

          const { error } = await this.supabase
            .from('scheme_interests')
            .insert(interestData);

          if (error) {
            console.error('[ExtractionService] Failed to insert scheme interest:', error);
          }
        }
      }

      console.log(`[ExtractionService] Stored ${matchedSchemes.length} scheme interests`);

      // Mark extraction job as completed
      await this.updateExtractionJob(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Invalidate analytics cache
      try {
        const { AnalyticsService } = await import('./analyticsService');
        const analyticsService = new AnalyticsService({ supabaseClient: this.supabase });
        await analyticsService.invalidateCache();
        console.log('[ExtractionService] Analytics cache invalidated');
      } catch (cacheError) {
        console.error('[ExtractionService] Failed to invalidate cache:', cacheError);
        // Don't throw - cache invalidation failure shouldn't break extraction
      }

      console.log('[ExtractionService] Extraction results stored successfully');
    } catch (error) {
      console.error('[ExtractionService] Failed to store extraction results:', error);
      
      // Mark job as failed
      await this.updateExtractionJob(jobId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Update extraction job status
   */
  private async updateExtractionJob(
    jobId: string,
    updates: ExtractionJobUpdate
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('extraction_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('[ExtractionService] Failed to update extraction job:', error);
      }
    } catch (error) {
      console.error('[ExtractionService] Exception updating extraction job:', error);
    }
  }
}
