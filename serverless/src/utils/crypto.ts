import { createHmac } from 'crypto';

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify HMAC signature for a message
 * @param message - The message to verify
 * @param signature - The signature to verify against (base64url encoded)
 * @param secret - The secret key
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns true if signature is valid, false otherwise
 */
export function verifyHMACSignature(
  message: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = createHmac(algorithm, secret)
    .update(message)
    .digest('base64url');

  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Create HMAC signature for a message
 * @param message - The message to sign
 * @param secret - The secret key
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns base64url encoded signature
 */
export function createHMACSignature(
  message: string,
  secret: string,
  algorithm: string = 'sha256'
): string {
  return createHmac(algorithm, secret)
    .update(message)
    .digest('base64url');
}