/**
 * Job Queue Processor
 * 
 * Processes extraction jobs from the queue with priority-based
 * processing, retry logic, and error handling.
 */

import { createAnalyticsClient } from '@/lib/supabase/analytics-client';
import type { ExtractionJob, ExtractionJobUpdate } from '@/types/database';

export interface ProcessingOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  retryBackoffMultiplier?: number;
}

export interface JobQueueProcessorOptions extends ProcessingOptions {}

export interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

/**
 * Default processor options
 */
const DEFAULT_OPTIONS: Required<JobQueueProcessorOptions> = {
  batchSize: 10,
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
};

/**
 * Job queue processor service
 */
export class JobQueueProcessor {
  private options: Required<JobQueueProcessorOptions>;
  private isProcessing: boolean = false;

  constructor(options: JobQueueProcessorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process pending extraction jobs from the queue
   */
  async processExtractionQueue(limit?: number): Promise<ProcessingResult> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[JobQueue] Already processing, skipping...');
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    this.isProcessing = true;
    const batchSize = limit || this.options.batchSize;

    try {
      console.log(`[JobQueue] Starting batch processing (limit: ${batchSize})`);

      const supabase = createAnalyticsClient();

      // Fetch pending jobs ordered by priority and creation time
      const { data: jobs, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true }) // high < normal < low
        .order('created_at', { ascending: true }) // oldest first
        .limit(batchSize);

      if (error) {
        console.error('[JobQueue] Failed to fetch jobs:', error);
        return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
      }

      if (!jobs || jobs.length === 0) {
        console.log('[JobQueue] No pending jobs found');
        return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
      }

      console.log(`[JobQueue] Found ${jobs.length} pending jobs`);

      const result: ProcessingResult = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      };

      // Process each job
      for (const job of jobs as ExtractionJob[]) {
        try {
          await this.processJob(job);
          result.processed++;
          result.succeeded++;
        } catch (error) {
          console.error(`[JobQueue] Failed to process job ${job.id}:`, error);
          result.processed++;
          result.failed++;
        }
      }

      console.log('[JobQueue] Batch processing complete:', result);
      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single extraction job
   */
  private async processJob(job: ExtractionJob): Promise<void> {
    const supabase = createAnalyticsClient();

    try {
      console.log(`[JobQueue] Processing job ${job.id} for conversation ${job.conversation_id}`);

      // Mark job as processing
      const updateProcessing: ExtractionJobUpdate = {
        status: 'processing',
        started_at: new Date().toISOString(),
      };
      await (supabase
        .from('extraction_jobs') as any)
        .update(updateProcessing)
        .eq('id', job.id);

      // Call extraction service to process the conversation
      const { ExtractionService } = await import('./extractionService');
      const extractionService = new ExtractionService(supabase);
      
      // Extract data from conversation
      const extractionResult = await extractionService.extractFromConversation(
        job.conversation_id
      );
      
      // Store extraction results
      await extractionService.storeExtractionResults(
        job.conversation_id,
        job.user_id,
        extractionResult,
        job.id
      );

      // Mark job as completed
      const updateCompleted: ExtractionJobUpdate = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      await (supabase
        .from('extraction_jobs') as any)
        .update(updateCompleted)
        .eq('id', job.id);

      console.log(`[JobQueue] Job ${job.id} completed successfully`);
    } catch (error: any) {
      console.error(`[JobQueue] Job ${job.id} failed:`, error);

      // Check if we should retry
      const shouldRetry = job.retry_count < this.options.maxRetries;

      if (shouldRetry) {
        // Calculate retry delay with exponential backoff
        const retryDelay =
          this.options.retryDelayMs *
          Math.pow(this.options.retryBackoffMultiplier, job.retry_count);

        console.log(
          `[JobQueue] Scheduling retry for job ${job.id} (attempt ${job.retry_count + 1}/${this.options.maxRetries}) in ${retryDelay}ms`
        );

        // Reset to pending with incremented retry count
        const updateRetry: ExtractionJobUpdate = {
          status: 'pending',
          retry_count: job.retry_count + 1,
          error_message: error.message || 'Unknown error',
          started_at: null,
        };
        await (supabase
          .from('extraction_jobs') as any)
          .update(updateRetry)
          .eq('id', job.id);

        // Wait for retry delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        // Max retries reached, mark as failed
        console.error(
          `[JobQueue] Job ${job.id} failed after ${job.retry_count} retries`
        );

        const updateFailed: ExtractionJobUpdate = {
          status: 'failed',
          error_message: error.message || 'Unknown error',
          completed_at: new Date().toISOString(),
        };
        await (supabase
          .from('extraction_jobs') as any)
          .update(updateFailed)
          .eq('id', job.id);
      }

      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const supabase = createAnalyticsClient();

    const [pendingResult, processingResult, completedResult, failedResult] =
      await Promise.all([
        supabase
          .from('extraction_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('extraction_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'processing'),
        supabase
          .from('extraction_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('extraction_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'failed'),
      ]);

    const pending = pendingResult.count || 0;
    const processing = processingResult.count || 0;
    const completed = completedResult.count || 0;
    const failed = failedResult.count || 0;

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }

  /**
   * Clear completed jobs older than specified days
   */
  async clearOldJobs(daysOld: number = 30): Promise<number> {
    const supabase = createAnalyticsClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('extraction_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[JobQueue] Failed to clear old jobs:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`[JobQueue] Cleared ${deletedCount} old completed jobs`);
    return deletedCount;
  }

  /**
   * Retry all failed jobs
   */
  async retryFailedJobs(): Promise<number> {
    const supabase = createAnalyticsClient();

    const updateRetryAll: ExtractionJobUpdate = {
      status: 'pending',
      retry_count: 0,
      error_message: null,
      started_at: null,
      completed_at: null,
    };
    const { data, error } = await (supabase
      .from('extraction_jobs') as any)
      .update(updateRetryAll)
      .eq('status', 'failed')
      .select('id');

    if (error) {
      console.error('[JobQueue] Failed to retry failed jobs:', error);
      return 0;
    }

    const retriedCount = data?.length || 0;
    console.log(`[JobQueue] Retried ${retriedCount} failed jobs`);
    return retriedCount;
  }
}

/**
 * Create a job queue processor instance
 */
export function createJobQueueProcessor(
  options?: JobQueueProcessorOptions
): JobQueueProcessor {
  return new JobQueueProcessor(options);
}

// Export default instance
export const jobQueueProcessor = new JobQueueProcessor();
