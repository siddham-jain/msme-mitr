/**
 * Admin Manual Extraction Trigger API Endpoint
 * 
 * POST /api/admin/analytics/extract
 * 
 * Manually triggers extraction for a specific conversation.
 * Requires admin authentication.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/adminAuth';
import { ExtractionService } from '@/services/analytics/extractionService';

/**
 * POST handler for manual extraction trigger
 * 
 * Request Body:
 * {
 *   conversationId: string (required)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   data: {
 *     conversationId: string
 *     extractionResult: ExtractionResult
 *     jobId?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 or 403 error
    }

    const { supabase } = authResult;

    // Parse request body
    const body = await request.json();
    const { conversationId } = body;

    // Validate conversationId
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'conversationId is required and must be a string'
        },
        { status: 400 }
      );
    }

    console.log('[Admin API] Manual extraction triggered for conversation:', conversationId);

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, message_count')
      .eq('id', conversationId)
      .single() as { data: { id: string; user_id: string; message_count: number } | null; error: any };

    if (convError || !conversation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conversation not found',
          message: `No conversation found with ID: ${conversationId}`
        },
        { status: 404 }
      );
    }

    // Create or update extraction job
    const { data: existingJob } = await supabase
      .from('extraction_jobs')
      .select('id, status')
      .eq('conversation_id', conversationId)
      .eq('message_count_at_extraction', conversation.message_count)
      .maybeSingle() as { data: { id: string; status: string } | null; error: any };

    let jobId: string | undefined;

    if (existingJob && existingJob.status === 'pending') {
      // Job already exists and is pending
      jobId = existingJob.id;
      console.log('[Admin API] Using existing pending job:', jobId);
    } else {
      // Create new extraction job
      const insertResult = await (supabase as any)
        .from('extraction_jobs')
        .insert({
          conversation_id: conversationId,
          user_id: conversation.user_id,
          message_count_at_extraction: conversation.message_count,
          status: 'processing',
          priority: 'high', // Manual triggers are high priority
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      const { data: newJob, error: jobError } = insertResult;

      if (jobError) {
        console.error('[Admin API] Error creating extraction job:', jobError);
        // Continue with extraction even if job creation fails
      } else if (newJob) {
        jobId = newJob.id;
        console.log('[Admin API] Created extraction job:', jobId);
      }
    }

    // Perform extraction
    const extractionService = new ExtractionService(supabase);
    const extractionResult = await extractionService.extractFromConversation(conversationId);

    // Update job status to completed
    if (jobId) {
      await (supabase as any)
        .from('extraction_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }

    console.log('[Admin API] Manual extraction completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        extractionResult,
        jobId
      }
    });

  } catch (error) {
    console.error('[Admin API] Error during manual extraction:', error);
    
    // Try to update job status to failed if we have a jobId
    // (This would require passing jobId through the error context)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform extraction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
