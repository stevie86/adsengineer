import type { AppEnv } from '../types';

// SHA256 hash function for Meta privacy compliance
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface MetaConversionData {
  fbclid?: string;
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  custom_data?: {
    order_id?: string;
    content_name?: string;
    content_category?: string;
  };
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
  };
}

export class MetaConversionsAPI {
  private accessToken: string;
  private pixelId: string;
  private apiVersion: string = 'v18.0';

  constructor(accessToken: string, pixelId: string) {
    this.accessToken = accessToken;
    this.pixelId = pixelId;
  }

  async uploadConversions(conversions: MetaConversionData[]): Promise<{
    success: boolean;
    events_received?: number;
    events_processed?: number;
    errors?: Array<{ code: number; message: string }>;
  }> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;

    const data = await Promise.all(
      conversions.map(async (conversion) => {
        // Prepare user data with hashing
        const userData: any = {};

        if (conversion.user_data?.email) {
          userData.em = [await hashData(conversion.user_data.email)];
        }

        if (conversion.user_data?.phone) {
          userData.ph = [await hashData(conversion.user_data.phone)];
        }

        if (conversion.user_data?.external_id) {
          userData.external_id = conversion.user_data.external_id;
        }

        return {
          event_name: conversion.event_name,
          event_time: conversion.event_time,
          custom_data: {
            value: conversion.value,
            currency: conversion.currency || 'EUR',
            ...conversion.custom_data,
          },
          user_data: userData,
          ...(conversion.fbclid && {
            fbclid: conversion.fbclid,
          }),
        };
      })
    );

    const payload = {
      access_token: this.accessToken,
      data,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as any;

      if (!response.ok) {
        console.error('Meta Conversions API error:', result);
        return {
          success: false,
          errors: result.error
            ? [result.error]
            : [{ code: response.status, message: result.message || 'Unknown error' }],
        };
      }

      return {
        success: true,
        events_received: result.events_received,
        events_processed: result.events_processed,
      };
    } catch (error) {
      console.error('Meta API network error:', error);
      return {
        success: false,
        errors: [{ code: 0, message: error instanceof Error ? error.message : 'Network error' }],
      };
    }
  }

  // Validate Meta credentials
  async validateCredentials(): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/me/accounts`;
      const response = await fetch(`${url}?access_token=${this.accessToken}`);
      return response.ok;
    } catch (error) {
      console.error('Meta credentials validation error:', error);
      return false;
    }
  }
}

// Queue handler for Meta conversions
export async function processMetaConversionBatch(env: AppEnv['Bindings'], job: any): Promise<any> {
  const { conversions, agency_id, retry_count } = job;

  try {
    // Get agency Meta credentials
    const credentials = await getAgencyMetaCredentials(env, agency_id);
    if (!credentials) {
      throw new Error(`No Meta credentials found for agency ${agency_id}`);
    }

    const metaAPI = new MetaConversionsAPI(credentials.access_token, credentials.pixel_id);

    // Validate credentials
    const isValid = await metaAPI.validateCredentials();
    if (!isValid) {
      throw new Error(`Invalid Meta credentials for agency ${agency_id}`);
    }

    // Convert our format to Meta format with proper deduplication
    const metaConversions: MetaConversionData[] = conversions.map((conv: any) => ({
      fbclid: conv.fbclid,
      event_name: 'Purchase', // Meta standard event for conversions
      event_time: Math.floor(new Date(conv.conversion_time).getTime() / 1000),
      event_id: `advocate_${conv.order_id || conv.external_id}_${Math.floor(new Date(conv.conversion_time).getTime() / 1000)}`, // Deduplication key
      value: conv.conversion_value,
      currency: conv.currency_code,
      custom_data: {
        order_id: conv.order_id,
        content_name: 'Conversion from Advocate',
      },
      user_data: {
        external_id: conv.external_id,
      },
    }));

    const result = await metaAPI.uploadConversions(metaConversions);

    // Log results
    await logMetaConversionResult(env, {
      job_id: job.id,
      agency_id,
      batch_size: conversions.length,
      success_count: result.events_processed || 0,
      failure_count: conversions.length - (result.events_processed || 0),
      retry_count,
      errors: result.errors || [],
      processing_time: Date.now() - new Date(job.created_at).getTime(),
    });

    return {
      success: result.success,
      job_id: job.id,
      processed_count: result.events_processed || 0,
      failed_count: conversions.length - (result.events_processed || 0),
      retry_count,
      errors: result.errors || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logMetaConversionResult(env, {
      job_id: job.id,
      agency_id,
      batch_size: conversions.length,
      success_count: 0,
      failure_count: conversions.length,
      retry_count,
      errors: [errorMessage],
      processing_time: Date.now() - new Date(job.created_at).getTime(),
    });

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

async function getAgencyMetaCredentials(env: AppEnv['Bindings'], agencyId: string) {
  try {
    const result = await env.DB.prepare('SELECT meta_config FROM agencies WHERE id = ?')
      .bind(agencyId)
      .first();

    if (!result?.meta_config) return null;

    // Import decryption service dynamically
    const { decryptCredential } = await import('./encryption');

    const decrypted: string = await decryptCredential(
      JSON.parse(result.meta_config as string),
      `agency-${agencyId}-meta`
    );
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to retrieve Meta credentials:', error);
    return null;
  }
}

async function logMetaConversionResult(env: AppEnv['Bindings'], result: any): Promise<void> {
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
