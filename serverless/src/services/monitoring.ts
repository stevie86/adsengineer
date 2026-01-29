/**
 * Production Monitoring Service
 * 
 * Provides structured logging, error tracking, and performance monitoring
 * for production Cloudflare Workers deployments.
 */

import { Env } from '../types/env.js';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  timestamp: string;
  event: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, unknown>;
  error?: Error;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private env: Env;
  private analyticsEnabled: boolean;

  constructor(env: Env) {
    this.env = env;
    this.analyticsEnabled = env.D1_ANALYTICS_ENABLED === 'true';
  }

  /**
   * Log structured event with level
   */
  log(entry: LogEntry): void {
    const logEntry: LogEntry = {
      level: entry.level || 'info',
      timestamp: new Date().toISOString(),
      event: entry.event,
      userId: entry.userId,
      sessionId: entry.sessionId,
      data: entry.data || {},
      error: entry.error,
      metadata: entry.metadata,
    };

    // Console logging (Cloudflare Workers logs)
    console.log(JSON.stringify(logEntry));

    // D1 Analytics (if enabled)
    if (this.analyticsEnabled && this.env.DB) {
      this.persistToD1(logEntry).catch((err) => {
        console.error('Failed to persist to D1:', err);
      });
    }

    // Error notifications (if webhook configured)
    if (entry.level === 'error' && this.env.ERROR_NOTIFICATION_WEBHOOK) {
      this.sendErrorNotification(logEntry).catch((err) => {
        console.error('Failed to send error notification:', err);
      });
    }
  }

  /**
   * Persist log entry to D1 database
   */
  private async persistToD1(entry: LogEntry): Promise<void> {
    if (!this.env.DB) return;

    const sql = `
      INSERT INTO requests (event_type, user_id, session_id, page_url, 
                            referrer_url, user_agent, status_code, 
                            response_time_ms, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.env.DB.prepare(sql)
      .bind(
        entry.event,
        entry.userId,
        entry.sessionId,
        entry.data.pageUrl || null,
        entry.data.referrerUrl || null,
        entry.data.userAgent || null,
        entry.data.statusCode || null,
        entry.data.responseTimeMs || null,
        JSON.stringify(entry.error ? entry.error.message : entry.data)
      )
      .run();
  }

  /**
   * Send error notification to webhook
   */
  private async sendErrorNotification(entry: LogEntry): Promise<void> {
    if (!this.env.ERROR_NOTIFICATION_WEBHOOK) return;

    try {
      await fetch(this.env.ERROR_NOTIFICATION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: entry.level,
          timestamp: entry.timestamp,
          event: entry.event,
          errorMessage: entry.error?.message,
          stackTrace: entry.error?.stack,
          env: 'production',
        }),
      });
    } catch (err) {
      console.error('Failed to send webhook:', err);
    }
  }

  /**
   * Performance tracking
   */
  trackPerformance(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.log({
      level: 'info',
      event: 'performance',
      data: {
        metric,
        value,
        tags,
      },
    });
  }

  /**
   * Request tracking
   */
  trackRequest(method: string, url: string, statusCode: number, responseTimeMs: number): void {
    this.log({
      level: 'info',
      event: 'request',
      data: {
        method,
        url,
        statusCode,
        responseTimeMs,
      },
    });
  }

  /**
   * Error tracking
   */
  trackError(error: Error, context: Record<string, unknown> = {}): void {
    this.log({
      level: 'error',
      event: 'error',
      error,
      metadata: context,
    });
  }

  /**
   * Conversion tracking
   */
  trackConversion(
    eventType: string,
    platform: string,
    platformEventId: string,
    metadata: Record<string, unknown>
  ): void {
    this.log({
      level: 'info',
      event: 'conversion',
      data: {
        eventType,
        platform,
        platformEventId,
        metadata,
      },
    });
  }
}

// Export singleton
export const monitoring = new MonitoringService(process.env as unknown as Env);