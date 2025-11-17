/**
 * Extraction Trigger Service
 * 
 * Determines when to trigger extraction jobs for conversations
 * and manages the extraction job queue.
 */

import { createAnalyticsClient } from '@/lib/supabase/analytics-client';
import type { ExtractionJob, ExtractionJobInsert } from '@/types/database';

// Keywords that indicate scheme-related discussion
const SCHEME_KEYWORDS = [
  'scheme', 'yojana', 'योजना', 'mudra', 'मुद्रा', 'pmegp', 'startup india',
  'credit', 'loan', 'subsidy', 'grant', 'funding', 'financial assistance',
  'government scheme', 'सरकारी योजना', 'apply', 'eligible', 'eligibility'
];

// Keywords that indicate business information
const BUSINESS_KEYWORDS = [
  'business', 'व्यवसाय', 'karobar', 'कारोबार', 'dukaan', 'दुकान', 'shop',
  'company', 'firm', 'enterprise', 'industry', 'उद्योग', 'manufacturing',
  'retail', 'service', 'location', 'city', 'state', 'employees', 'turnover',
  'revenue', 'sales', 'small', 'micro', 'medium', 'chota', 'छोटा', 'bada', 'बड़ा'
];

export interface TriggerConditions {
  messageThreshold: number;
  checkSchemeKeywords: boolean;
  checkBusinessKeywords: boolean;
}

export interface ExtractionTriggerService {
  shouldTriggerExtraction(conversationId: string): Promise<boolean>;
  queueExtractionJob(
    conversationId: string,
    priority?: 'high' | 'normal' | 'low'
  ): Promise<string | null>;
  getLastExtractionJob(conversationId: string): Promise<ExtractionJob | null>;
}

/**
 * Default trigger conditions
 */
const DEFAULT_CONDITIONS: TriggerConditions = {
  messageThreshold: 3, // Trigger every 3 messages
  checkSchemeKeywords: true,
  checkBusinessKeywords: true,
};

/**
 * Check if text contains any of the given keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Create extraction trigger service instance
 */
export function createExtractionTriggerService(
  conditions: TriggerConditions = DEFAULT_CONDITIONS
): ExtractionTriggerService {
  
  /**
   * Get the last extraction job for a conversation
   */
  async function getLastExtractionJob(
    conversationId: string
  ): Promise<ExtractionJob | null> {
    const supabase = createAnalyticsClient();
    
    const { data, error } = await supabase
      .from('extraction_jobs')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    return data;
  }
  
  /**
   * Check if extraction should be triggered for a conversation
   */
  async function shouldTriggerExtraction(
    conversationId: string
  ): Promise<boolean> {
    try {
      const supabase = createAnalyticsClient();
      
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('message_count, user_id')
        .eq('id', conversationId)
        .maybeSingle();
      
      if (convError || !conversation) {
        console.error('Failed to fetch conversation:', convError);
        return false;
      }
      
      // Get last extraction job
      const lastJob = await getLastExtractionJob(conversationId);
      
      // Calculate messages since last extraction
      // Type assertion needed due to Supabase client type inference limitations
      const messageCount = (conversation as any).message_count as number;
      const lastJobMessageCount = lastJob?.message_count_at_extraction || 0;
      const messagesSinceLastExtraction = lastJob
        ? messageCount - lastJobMessageCount
        : messageCount;
      
      // Condition 1: Message threshold reached
      if (messagesSinceLastExtraction >= conditions.messageThreshold) {
        return true;
      }
      
      // Condition 2: Check for scheme or business keywords in recent messages
      if (conditions.checkSchemeKeywords || conditions.checkBusinessKeywords) {
        // Get recent messages since last extraction
        const messagesToCheck = Math.min(messagesSinceLastExtraction, 5);
        
        const { data: recentMessages, error: msgError } = await supabase
          .from('messages')
          .select('content, role')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(messagesToCheck);
        
        if (msgError || !recentMessages || recentMessages.length === 0) {
          return false;
        }
        
        // Check for keywords in user messages
        // Type assertion needed due to Supabase client type inference limitations
        const userMessages = recentMessages.filter((m: any) => m.role === 'user');
        const combinedText = userMessages.map((m: any) => m.content as string).join(' ');
        
        if (conditions.checkSchemeKeywords && containsKeywords(combinedText, SCHEME_KEYWORDS)) {
          return true;
        }
        
        if (conditions.checkBusinessKeywords && containsKeywords(combinedText, BUSINESS_KEYWORDS)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking extraction trigger:', error);
      return false;
    }
  }
  
  /**
   * Queue an extraction job
   */
  async function queueExtractionJob(
    conversationId: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string | null> {
    try {
      const supabase = createAnalyticsClient();
      
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('message_count, user_id')
        .eq('id', conversationId)
        .maybeSingle();
      
      if (convError || !conversation) {
        console.error('Failed to fetch conversation for job queue:', convError);
        return null;
      }
      
      // Create extraction job
      // Type assertion needed due to Supabase client type inference limitations
      const jobData: ExtractionJobInsert = {
        conversation_id: conversationId,
        user_id: (conversation as any).user_id as string,
        message_count_at_extraction: (conversation as any).message_count as number,
        priority,
        status: 'pending',
        retry_count: 0,
      };
      
      // Type assertion needed due to Supabase client type inference limitations
      const { data: job, error: jobError } = await (supabase
        .from('extraction_jobs') as any)
        .insert(jobData)
        .select()
        .single();
      
      if (jobError) {
        // Check if it's a duplicate job error (unique constraint violation)
        if (jobError.code === '23505') {
          console.log('Extraction job already exists for this conversation and message count');
          return null;
        }
        
        console.error('Failed to create extraction job:', jobError);
        return null;
      }
      
      console.log(`Extraction job queued: ${(job as any).id} for conversation ${conversationId}`);
      return (job as any).id as string;
    } catch (error) {
      console.error('Error queueing extraction job:', error);
      return null;
    }
  }
  
  return {
    shouldTriggerExtraction,
    queueExtractionJob,
    getLastExtractionJob,
  };
}

// Export default instance
export const extractionTriggerService = createExtractionTriggerService();
