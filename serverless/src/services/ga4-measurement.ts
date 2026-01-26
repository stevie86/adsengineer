import type { AppEnv } from '../types';
import { Logger } from './logging';

const logger = Logger.getInstance();

export interface GA4Config {
  measurementId: string;
  apiSecret: string;
  clientId?: string;
  userId?: string;
}

export interface GA4Event {
  name: string;
  params?: Record<string, any>;
  timestamp_micros?: number;
}

export interface GA4EventPayload {
  client_id?: string;
  user_id?: string;
  timestamp_micros?: number;
  events: GA4Event[];
}

export interface GA4Response {
  success: boolean;
  events_sent?: number;
  errors?: string[];
}

export class GA4MeasurementError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GA4MeasurementError';
  }
}

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA4_DEBUG_ENDPOINT = 'https://www.google-analytics.com/mp/collect/debug';

const MAX_EVENTS_PER_REQUEST = 25;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class GA4MeasurementClient {
  private measurementId: string;
  private apiSecret: string;
  private debugMode: boolean;

  constructor(config: GA4Config, debugMode: boolean = false) {
    this.measurementId = config.measurementId;
    this.apiSecret = config.apiSecret;
    this.debugMode = debugMode;
  }

  private getEndpoint(): string {
    return this.debugMode ? GA4_DEBUG_ENDPOINT : GA4_ENDPOINT;
  }

  private buildUrl(): string {
    return `${this.getEndpoint()}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
  }

  async sendEvent(event: GA4Event, clientId?: string, userId?: string): Promise<GA4Response> {
    return this.sendBatch([event], clientId, userId);
  }

  async sendBatch(events: GA4Event[], clientId?: string, userId?: string): Promise<GA4Response> {
    if (events.length === 0) {
      throw new GA4MeasurementError('No events to send', 'NO_EVENTS');
    }

    if (events.length > MAX_EVENTS_PER_REQUEST) {
      logger.log('WARN', `Too many events (${events.length}), splitting into batches`);
      return this.sendLargeBatch(events, clientId, userId);
    }

    const payload: GA4EventPayload = {
      ...(clientId && { client_id: clientId }),
      ...(userId && { user_id: userId }),
      events,
    };

    return this.retryRequest(this.buildUrl(), payload);
  }

  private async sendLargeBatch(
    events: GA4Event[],
    clientId?: string,
    userId?: string
  ): Promise<GA4Response> {
    const batches: GA4Event[][] = [];
    for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
      batches.push(events.slice(i, i + MAX_EVENTS_PER_REQUEST));
    }

    const results: GA4Response[] = [];
    for (const batch of batches) {
      const result = await this.sendBatch(batch, clientId, userId);
      results.push(result);
    }

    const totalErrors = results.flatMap((r) => r.errors || []);
    const totalSent = results.reduce((sum, r) => sum + (r.events_sent || 0), 0);

    return {
      success: totalErrors.length === 0,
      events_sent: totalSent,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
    };
  }

  private async retryRequest(
    url: string,
    payload: GA4EventPayload,
    attempt: number = 1
  ): Promise<GA4Response> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (this.debugMode) {
        logger.log('DEBUG', 'GA4 MPv2 Request', {
          url,
          payload,
          status: response.status,
          responseText: await response.clone().text(),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new GA4MeasurementError(
          `GA4 API error: ${response.status} ${response.statusText}`,
          response.status.toString(),
          errorText
        );
      }

      const eventCount = payload.events.length;
      logger.log('INFO', 'GA4 event sent', {
        event_count: eventCount,
        measurement_id: this.measurementId,
        attempt,
      });

      return {
        success: true,
        events_sent: eventCount,
      };
    } catch (error) {
      if (error instanceof GA4MeasurementError) {
        if (attempt < MAX_RETRIES && this.shouldRetry(error)) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          logger.log('WARN', `GA4 request failed, retrying in ${delay}ms`, {
            attempt,
            max_retries: MAX_RETRIES,
            error: error.message,
          });

          await this.sleep(delay);
          return this.retryRequest(url, payload, attempt + 1);
        }

        logger.log('ERROR', 'GA4 request failed after retries', {
          attempts: attempt,
          error: error.message,
          code: error.code,
        });

        return {
          success: false,
          errors: [error.message],
        };
      }

      logger.log('ERROR', 'Unexpected GA4 request error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private shouldRetry(error: GA4MeasurementError): boolean {
    if (!error.code) return false;

    const retryableCodes = ['429', '500', '502', '503', '504'];
    return retryableCodes.includes(error.code);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  validateEvent(event: GA4Event): boolean {
    if (!event.name || event.name.trim().length === 0) {
      return false;
    }

    if (event.name.length > 40) {
      logger.log('WARN', 'Event name too long', { name: event.name });
      return false;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(event.name)) {
      logger.log('WARN', 'Invalid event name format', { name: event.name });
      return false;
    }

    if (event.params && Object.keys(event.params).length > 25) {
      logger.log('WARN', 'Too many parameters in event');
      return false;
    }

    return true;
  }
}

export async function createGA4Client(
  env: AppEnv['Bindings'],
  measurementId: string,
  apiSecret: string,
  debugMode: boolean = false
): Promise<GA4MeasurementClient> {
  if (!measurementId || !apiSecret) {
    throw new GA4MeasurementError('Missing GA4 configuration', 'MISSING_CONFIG');
  }

  return new GA4MeasurementClient(
    {
      measurementId,
      apiSecret,
    },
    debugMode
  );
}
