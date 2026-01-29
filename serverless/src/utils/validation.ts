/**
 * Input Validation Schemas
 * 
 * Zod schemas for validating API requests
 */

import {
  string,
  z,
  object,
  boolean,
  number,
  enum as zEnum,
  array,
  optional,
} from 'zod';

// Email validation with MX record check
export const EmailSchema = string()
  .min(5, 'Email too short')
  .max(254, 'Email too long')
  .email('Invalid email format')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format');

// Password requirements
export const PasswordSchema = string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User ID validation
export const UserIdSchema = string()
  .min(1, 'User ID required')
  .max(100, 'User ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'User ID can only contain letters, numbers, underscores, and hyphens');

// Session ID validation
export const SessionIdSchema = string()
  .min(1, 'Session ID required')
  .max(100, 'Session ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Session ID can only contain letters, numbers, underscores, and hyphens');

// Platform validation
export const PlatformSchema = zEnum([
  'google-ads',
  'meta',
  'tiktok',
  'shopify',
  'woocommerce',
  'highlevel',
] as const);

// Tracking event validation
export const TrackingEventSchema = object({
  eventType: string().min(1, 'Event type required'),
  platform: PlatformSchema,
  platformEventId: string().min(1, 'Platform event ID required'),
  data: object(
    {
      email: optional(EmailSchema),
      phone: optional(string().regex(/^\+?\d{10,15}$/)),
      gclid: optional(string()),
      fbclid: optional(string()),
      value: optional(number()),
      currency: optional(string()),
    },
    { strict: false },
  ),
});

// Webhook payload validation
export const WebhookPayloadSchema = object({
  timestamp: string().min(1, 'Timestamp required'),
  event: string().min(1, 'Event required'),
  data: object(
    {
      email: optional(EmailSchema),
      phone: optional(string()),
      gclid: optional(string()),
      fbclid: optional(string()),
      customFields: optional(record(string(), unknown())),
    },
    { strict: false },
  ),
  signature: string().min(1, 'Signature required'),
});

const sanitizQuery = (query: Record<string, string | string[]>): Record<string, string | string[]> => {
  const sanitized: Record<string, string | string[]> = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (key.match(/^[a-zA-Z0-9_-]+$/) === null) {
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/[<>'"]/g, '')
        .substring(0, 500);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((v) =>
        v.replace(/[<>'"]/g, '').substring(0, 500),
      );
    }
  }
  
  return sanitized;
};