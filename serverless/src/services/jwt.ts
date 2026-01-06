import { verifyHMACSignature } from '../utils/crypto';

export interface JWTPayload {
  sub: string;      // Subject (user ID)
  iss: string;      // Issuer
  aud: string;      // Audience
  exp: number;      // Expiration time
  iat?: number;     // Issued at
  org_id?: string;  // Organization ID
  role?: string;    // User role
}

export class JWTService {
  constructor(private secret: string) {}

  /**
   * Verify a JWT token and return the payload if valid
   * @param token - The JWT token to verify
   * @returns JWTPayload if valid, null if invalid
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;

      // Verify signature
      const message = `${headerB64}.${payloadB64}`;
      if (!verifyHMACSignature(message, signatureB64, this.secret)) {
        return null; // Invalid signature
      }

      // Decode payload
      const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload: JWTPayload = JSON.parse(payloadJson);

      // Validate claims
      if (!this.validateClaims(payload)) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Create a new JWT token
   * @param payloadData - The payload data (without standard claims)
   * @returns The complete JWT token
   */
  createToken(payloadData: Omit<JWTPayload, 'iss' | 'aud' | 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payloadData,
      iss: 'adsengineer',
      aud: 'adsengineer-api',
      iat: now,
      exp: now + 3600, // 1 hour
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const message = `${headerB64}.${payloadB64}`;
    const signature = createHmac('sha256', this.secret)
      .update(message)
      .digest('base64url');

    return `${message}.${signature}`;
  }

  /**
   * Validate JWT claims
   * @param payload - The JWT payload to validate
   * @returns true if claims are valid, false otherwise
   */
  private validateClaims(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Check issuer
    if (payload.iss !== 'adsengineer') {
      return false;
    }

    // Check audience
    if (payload.aud !== 'adsengineer-api') {
      return false;
    }

    return true;
  }
}

// Import here to avoid circular dependency
import { createHmac } from 'crypto';