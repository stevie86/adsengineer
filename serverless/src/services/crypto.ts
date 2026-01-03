import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Validates HMAC signature for webhook payloads
 * @param payload Raw request body as string
 * @param signature Received signature from header
 * @param secret Webhook secret key
 * @returns boolean indicating if signature is valid
 */
export function validateHmacSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Generate expected signature
    const expectedSignature = hmac(sha256, secret, payload);

    // Convert to hex string for comparison
    const expectedHex = Buffer.from(expectedSignature).toString('hex');

    // Shopify signatures are prefixed with 'sha256='
    const expectedFullSignature = `sha256=${expectedHex}`;

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(signature, expectedFullSignature);
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extracts and validates Shopify webhook signature
 * @param headers Request headers
 * @param body Raw request body
 * @param secret Webhook secret
 * @returns validation result
 */
export function validateShopifyWebhook(
  headers: Record<string, string | undefined>,
  body: string,
  secret: string
): { valid: boolean; error?: string } {
  const signature = headers['x-shopify-hmac-sha256'];

  if (!signature) {
    return { valid: false, error: 'Missing HMAC signature header' };
  }

  if (!secret) {
    return { valid: false, error: 'Webhook secret not configured' };
  }

  const isValid = validateHmacSignature(body, signature, secret);

  if (!isValid) {
    return { valid: false, error: 'Invalid HMAC signature' };
  }

  return { valid: true };
}
