/**
 * GCLID (Google Click ID) utilities
 *
 * GCLIDs are used to track Google Ads clicks and are essential for
 * conversion tracking. This module provides validation, hashing,
 * and redaction utilities for GCLIDs.
 *
 * GCLID Format:
 * - Typically starts with "GCLID_" prefix
 * - Contains alphanumeric characters, hyphens, and underscores
 * - Length varies but is generally 40-80 characters
 */

// Regex for validating GCLIDs - matches standard Google Click ID format
export const GCLID_REGEX = /^GCLID_[A-Za-z0-9_-]{20,100}$/;

/**
 * Validate if a string is a properly formatted GCLID
 */
export function isValidGCLID(gclid: string | null | undefined): boolean {
  if (!gclid || typeof gclid !== 'string') {
    return false;
  }
  return GCLID_REGEX.test(gclid);
}

/**
 * Hash a GCLID for storage (one-way hash for privacy)
 * Uses SHA-256 which produces a fixed-length output
 */
export async function hashGCLID(gclid: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(gclid);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex string
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Redact a GCLID for logging purposes
 * Shows only first 8 and last 4 characters
 */
export function redactGCLID(gclid: string): string {
  if (gclid.length <= 12) {
    return '****';
  }
  return `${gclid.substring(0, 8)}...${gclid.substring(gclid.length - 4)}`;
}

/**
 * Sanitize GCLID - validate and return the original if valid,
 * null otherwise
 */
export function sanitizeGCLID(gclid: unknown): string | null {
  if (typeof gclid !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = gclid.trim();

  // Validate format
  if (!isValidGCLID(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Type guard for GCLID validation in TypeScript
 */
export function assertIsValidGCLID(value: unknown): asserts value is string {
  if (!isValidGCLID(value as string)) {
    throw new Error(`Invalid GCLID format: ${value}`);
  }
}
