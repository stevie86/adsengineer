import type { Context } from 'hono';

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  shopDomain?: string;
  webhookTopic?: string;
}

export interface SecurityEvent extends LogEntry {
  eventType: 'webhook_signature_failure' | 'payload_validation_error' | 'rate_limit_exceeded' | 'authentication_failure' | 'credential_access_denied';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'webhook' | 'api' | 'admin' | 'auth';
  details: {
    error?: string;
    attemptedValue?: string;
    shopDomain?: string;
    ipAddress?: string;
    userId?: string;
    requestId?: string;
  };
}

/**
 * Structured logging service with security event handling
 */
export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a general message
   */
  log(level: LogEntry['level'], message: string, context?: Record<string, any>, c?: Context): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.extractRequestId(c),
      ip: this.extractIp(c),
      userAgent: c?.req.header('User-Agent'),
      shopDomain: c?.req.header('X-Shopify-Shop-Domain'),
      webhookTopic: c?.req.header('X-Shopify-Topic')
    };

    this.writeLog(entry);
  }

  /**
   * Log a security event
   */
  security(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Always log security events to console with SECURITY prefix
    console.warn(`[SECURITY-${event.severity}] ${event.eventType}: ${event.message}`, {
      ...securityEvent.details,
      requestId: securityEvent.requestId,
      ip: securityEvent.details.ipAddress,
      shopDomain: securityEvent.details.shopDomain
    });

    // In production, this would also send to security monitoring system
    // this.sendToSecurityMonitoring(securityEvent);
  }

  /**
   * Log webhook signature validation failure
   */
  logWebhookSignatureFailure(c: Context, shopDomain: string, error: string): void {
    this.security({
      level: 'WARN',
      message: `Webhook signature validation failed for shop: ${shopDomain}`,
      eventType: 'webhook_signature_failure',
      severity: 'HIGH',
      source: 'webhook',
      context: {
        validationError: error,
        headers: this.redactSensitiveHeaders(this.headersToRecord(c.req.raw.headers))
      },
      details: {
        error,
        shopDomain,
        ipAddress: this.extractIp(c),
        requestId: this.extractRequestId(c)
      }
    });
  }

  /**
   * Log webhook payload validation error
   */
  logWebhookPayloadError(c: Context, shopDomain: string, topic: string, error: string): void {
    this.security({
      level: 'WARN',
      message: `Webhook payload validation failed: ${error}`,
      eventType: 'payload_validation_error',
      severity: 'MEDIUM',
      source: 'webhook',
      context: {
        topic,
        validationError: error,
        payloadSize: c.req.header('Content-Length')
      },
      details: {
        error,
        shopDomain,
        ipAddress: this.extractIp(c),
        requestId: this.extractRequestId(c)
      }
    });
  }

  /**
   * Log rate limit violation
   */
  logRateLimitExceeded(c: Context, key: string, limit: number, windowMs: number): void {
    this.security({
      level: 'WARN',
      message: `Rate limit exceeded for key: ${key}`,
      eventType: 'rate_limit_exceeded',
      severity: 'MEDIUM',
      source: 'webhook',
      context: {
        limit,
        windowMs,
        keyType: key.split(':')[0], // webhook:ip or webhook:shop
        retryAfter: Math.ceil(windowMs / 1000)
      },
      details: {
        ipAddress: this.extractIp(c),
        shopDomain: c.req.header('X-Shopify-Shop-Domain'),
        requestId: this.extractRequestId(c)
      }
    });
  }

  /**
   * Log successful security validations
   */
  logSecuritySuccess(c: Context, operation: string, shopDomain?: string): void {
    this.log('INFO', `Security validation passed: ${operation}`, {
      operation,
      shopDomain,
      ip: this.extractIp(c)
    }, c);
  }

  /**
   * Log authentication failures
   */
  logAuthFailure(c: Context, reason: string, attemptedUser?: string): void {
    this.security({
      level: 'WARN',
      message: `Authentication failed: ${reason}`,
      eventType: 'authentication_failure',
      severity: 'MEDIUM',
      source: 'auth',
      context: {
        reason,
        attemptedUser: this.redactUsername(attemptedUser)
      },
      details: {
        error: reason,
        ipAddress: this.extractIp(c),
        requestId: this.extractRequestId(c)
      }
    });
  }

  /**
   * Extract request ID from headers or generate one
   */
  private extractRequestId(c?: Context): string {
    return c?.req.header('X-Request-ID') ||
           c?.req.header('CF-RAY') ||
           `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract IP address from Cloudflare headers
   */
  private extractIp(c?: Context): string {
    return c?.req.header('CF-Connecting-IP') ||
           c?.req.header('X-Forwarded-For')?.split(',')[0] ||
           c?.req.header('X-Real-IP') ||
           'unknown';
  }

  /**
   * Convert Headers object to record
   */
  private headersToRecord(headers: Headers): Record<string, string | undefined> {
    const record: Record<string, string | undefined> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  /**
   * Redact sensitive headers before logging
   */
  private redactSensitiveHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    const redacted: Record<string, string> = {};
    const sensitiveHeaders = [
      'authorization',
      'x-shopify-hmac-sha256',
      'x-shopify-access-token',
      'stripe-signature',
      'cookie'
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        redacted[key] = '[REDACTED]';
      } else if (value) {
        redacted[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    }

    return redacted;
  }

  /**
   * Redact usernames/emails for privacy
   */
  private redactUsername(username?: string): string {
    if (!username) return 'unknown';
    if (username.includes('@')) {
      // Email: redact domain
      const [local] = username.split('@');
      return `${local.substring(0, 2)}***@***.***`;
    }
    // Other identifiers: show first 2 chars
    return username.length > 2 ? `${username.substring(0, 2)}***` : '***';
  }

  /**
   * Write log entry (in production, this would integrate with logging service)
   */
  private writeLog(entry: LogEntry): void {
    const logLevel = process.env.LOG_LEVEL || 'INFO';
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(logLevel);
    const entryLevelIndex = levels.indexOf(entry.level);

    if (entryLevelIndex >= currentLevelIndex) {
      const logMethod = entry.level === 'ERROR' ? 'error' :
                       entry.level === 'WARN' ? 'warn' :
                       entry.level === 'INFO' ? 'info' : 'debug';

      console[logMethod](`[${entry.level}] ${entry.message}`, {
        timestamp: entry.timestamp,
        requestId: entry.requestId,
        ip: entry.ip,
        shopDomain: entry.shopDomain,
        webhookTopic: entry.webhookTopic,
        ...entry.context
      });
    }
  }

  /**
   * Send security events to monitoring system (placeholder for production)
   */
  private sendToSecurityMonitoring(event: SecurityEvent): void {
    // In production, this would send to:
    // - SIEM system (Splunk, ELK, etc.)
    // - Security monitoring service (Datadog, New Relic, etc.)
    // - Alert system for critical events

    if (event.severity === 'CRITICAL') {
      // Immediate alert for critical security events
      console.error('🚨 CRITICAL SECURITY EVENT:', event);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common logging patterns
export const logWebhookSuccess = (c: Context, topic: string, shopDomain?: string) => {
  logger.logSecuritySuccess(c, `webhook_processed_${topic}`, shopDomain);
};

export const logWebhookFailure = (c: Context, shopDomain: string, error: string) => {
  logger.logWebhookSignatureFailure(c, shopDomain, error);
};

export const logPayloadError = (c: Context, shopDomain: string, topic: string, error: string) => {
  logger.logWebhookPayloadError(c, shopDomain, topic, error);
};

export const logRateLimit = (c: Context, key: string, limit: number, windowMs: number) => {
  logger.logRateLimitExceeded(c, key, limit, windowMs);
};