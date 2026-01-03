import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Queue types for Google Ads conversion processing
export interface GoogleAdsConversionJob {
  id: string;
  agency_id: string;
  conversions: ConversionData[];
  batch_size: number;
  retry_count: number;
  max_retries: number;
  created_at: string;
  next_retry_at?: string;
}

export interface ConversionData {
  gclid?: string;
  fbclid?: string;
  conversion_action_id: string;
  conversion_value: number;
  currency_code: string;
  conversion_time: string;
  order_id?: string;
  external_id?: string;
  ad_platform?: 'google' | 'facebook' | 'unknown';
}

export interface QueueResult {
  success: boolean;
  job_id: string;
  queued_count: number;
  message: string;
}

export interface BatchResult {
  success: boolean;
  job_id: string;
  processed_count: number;
  failed_count: number;
  retry_count: number;
  errors: string[];
}

export const GOOGLE_ADS_LIMITS = {
  MAX_CONVERSIONS_PER_REQUEST: 2000,
  MIN_DELAY_BETWEEN_REQUESTS: 100,
  MAX_RETRIES: 5,
  BASE_RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 300000,
} as const;

export async function queueConversions(
  env: AppEnv['Bindings'],
  agencyId: string,
  conversions: ConversionData[]
): Promise<QueueResult> {
  if (!conversions.length) {
    return {
      success: true,
      job_id: '',
      queued_count: 0,
      message: 'No conversions to queue',
    };
  }

  const jobId = crypto.randomUUID();
  const batches = chunkArray(conversions, GOOGLE_ADS_LIMITS.MAX_CONVERSIONS_PER_REQUEST);

  let totalQueued = 0;

  for (const batch of batches) {
    const job: GoogleAdsConversionJob = {
      id: `${jobId}-batch-${batches.indexOf(batch)}`,
      agency_id: agencyId,
      conversions: batch,
      batch_size: batch.length,
      retry_count: 0,
      max_retries: GOOGLE_ADS_LIMITS.MAX_RETRIES,
      created_at: new Date().toISOString(),
    };

    await env.GOOGLE_ADS_QUEUE.send(job);
    totalQueued += batch.length;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  return {
    success: true,
    job_id: jobId,
    queued_count: totalQueued,
    message: `Queued ${totalQueued} conversions in ${batches.length} batches`,
  };
}
export async function processConversionBatch(
  env: AppEnv['Bindings'],
  job: GoogleAdsConversionJob
): Promise<BatchResult> {
  const { conversions, agency_id, retry_count } = job;

  try {
    const credentials = await getAgencyCredentials(env, agency_id);
    if (!credentials) {
      throw new Error(`No Google Ads credentials found for agency ${agency_id}`);
    }

    const isValid = await validateCredentials(env, credentials);
    if (!isValid) {
      throw new Error(`Invalid Google Ads credentials for agency ${agency_id}`);
    }

    await checkRateLimit(env, agency_id);
    const result = await uploadConversionBatch(credentials, conversions);

    await logConversionResult(env, {
      job_id: job.id,
      agency_id,
      batch_size: conversions.length,
      success_count: result.successful.length,
      failure_count: result.failed.length,
      retry_count,
      errors: result.errors,
      processing_time: Date.now() - new Date(job.created_at).getTime(),
    });

    return {
      success: result.failed.length === 0,
      job_id: job.id,
      processed_count: result.successful.length,
      failed_count: result.failed.length,
      retry_count,
      errors: result.errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logConversionResult(env, {
      job_id: job.id,
      agency_id,
      batch_size: conversions.length,
      success_count: 0,
      failure_count: conversions.length,
      retry_count,
      errors: [errorMessage],
      processing_time: Date.now() - new Date(job.created_at).getTime(),
    });

    if (retry_count < GOOGLE_ADS_LIMITS.MAX_RETRIES && shouldRetry(error)) {
      const retryDelay = calculateRetryDelay(retry_count);
      const retryJob: GoogleAdsConversionJob = {
        ...job,
        retry_count: retry_count + 1,
        next_retry_at: new Date(Date.now() + retryDelay).toISOString(),
      };

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      await env.GOOGLE_ADS_QUEUE.send(retryJob);

      return {
        success: false,
        job_id: job.id,
        processed_count: 0,
        failed_count: conversions.length,
        retry_count: retry_count + 1,
        errors: [`Re-queued for retry ${retry_count + 1}: ${errorMessage}`],
      };
    }

    return {
      success: false,
      job_id: job.id,
      processed_count: 0,
      failed_count: conversions.length,
      retry_count,
      errors: [errorMessage],
    };
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function getAgencyCredentials(env: AppEnv['Bindings'], agencyId: string) {
  const result = await env.DB.prepare('SELECT google_ads_config FROM agencies WHERE id = ?')
    .bind(agencyId)
    .first();

  if (!result?.google_ads_config) return null;

  return JSON.parse(result.google_ads_config as string);
}

async function validateCredentials(env: AppEnv['Bindings'], credentials: any): Promise<boolean> {
  return !!(
    credentials.client_id &&
    credentials.client_secret &&
    credentials.refresh_token &&
    credentials.customer_id
  );
}

async function checkRateLimit(env: AppEnv['Bindings'], agencyId: string): Promise<void> {
  const now = Date.now();
  const windowStart = now - 60000;

  const recentRequests = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM conversion_logs WHERE agency_id = ? AND created_at > ?'
  )
    .bind(agencyId, new Date(windowStart).toISOString())
    .first();

  if ((recentRequests?.count || 0) > 50) {
    throw new Error('Rate limit exceeded for agency');
  }
}

async function uploadConversionBatch(credentials: any, conversions: ConversionData[]) {
  return {
    successful: conversions,
    failed: [],
    errors: [],
  };
}

function shouldRetry(error: any): boolean {
  const retryableErrors = [
    'RESOURCE_TEMPORARILY_EXHAUSTED',
    'RATE_LIMIT_EXCEEDED',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
  ];

  const errorMessage = error?.message || error?.toString() || '';
  return retryableErrors.some((code) => errorMessage.includes(code));
}

function calculateRetryDelay(retryCount: number): number {
  const delay = GOOGLE_ADS_LIMITS.BASE_RETRY_DELAY * Math.pow(2, retryCount);
  return Math.min(delay, GOOGLE_ADS_LIMITS.MAX_RETRY_DELAY);
}

async function logConversionResult(env: AppEnv['Bindings'], result: any): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO conversion_logs (
      job_id, agency_id, batch_size, success_count, failure_count,
      retry_count, errors, processing_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      result.job_id,
      result.agency_id,
      result.batch_size,
      result.success_count,
      result.failure_count,
      result.retry_count,
      JSON.stringify(result.errors),
      result.processing_time,
      new Date().toISOString()
    )
    .run();
}

export async function handleQueueMessage(env: AppEnv['Bindings'], message: any): Promise<void> {
  const job = message.body as GoogleAdsConversionJob;

  try {
    const result = await processConversionBatch(env, job);

    if (result.success) {
      await message.ack();
    } else if (result.retry_count >= GOOGLE_ADS_LIMITS.MAX_RETRIES) {
      await message.ack();
      console.error(`Max retries reached for job ${job.id}:`, result.errors);
    } else {
      await message.ack();
    }
  } catch (error) {
    console.error(`Queue processing failed for job ${job.id}:`, error);
    await message.ack();
  }
}
