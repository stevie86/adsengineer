import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JWTService } from '../services/jwt';

const testSecret = 'test-secret-key-for-testing-only-do-not-use-in-production';

describe('JWT Signature Verification', () => {
  let jwtService: JWTService;

  beforeEach(() => {
    jwtService = new JWTService(testSecret);
  });

  describe('Invalid Signature', () => {
    it('rejects token with invalid HMAC signature', async () => {
      const validToken = jwtService.createToken({ sub: 'user123', org_id: 'org456' });

      // Tamper with signature by changing one character
      const tamperedToken = validToken.slice(0, -1) + 'X' + validToken.slice(-1);

      const result = jwtService.verifyToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('rejects token with corrupted signature', async () => {
      const validToken = jwtService.createToken({ sub: 'user123', org_id: 'org456' });

      // Remove signature completely (invalid format)
      const noSignatureToken = validToken.split('.')[0] + '.' + validToken.split('.')[1];

      const result = jwtService.verifyToken(noSignatureToken);
      expect(result).toBeNull();
    });
  });

  describe('Invalid Claims', () => {
    it('rejects token with wrong issuer', async () => {
      const token = jwtService.createToken({ iss: 'attacker', sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });

    it('rejects token with wrong audience', async () => {
      const token = jwtService.createToken({ aud: 'wrong-audience', sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });

    it('rejects expired token', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const token = jwtService.createToken({ exp: expiredTime, sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });
  });

  describe('Valid Tokens', () => {
    it('accepts valid token with correct signature', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = jwtService.createToken({ 
        sub: 'user123',
        iss: 'adsengineer',
        aud: 'adsengineer-api',
        iat: now - 3600,
        exp: now + 3600,
        org_id: 'org456',
        role: 'admin',
      });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user123');
      expect(result?.iss).toBe('adsengineer');
      expect(result?.aud).toBe('adsengineer-api');
      expect(result?.org_id).toBe('org456');
      expect(result?.role).toBe('admin');
      expect(result?.exp).toBeGreaterThan(now);
    });

    it('accepts token with all required claims present', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = jwtService.createToken({ 
        sub: 'user123',
        iss: 'adsengineer',
        aud: 'adsengineer-api',
        iat: now - 3600,
        exp: now + 3600,
        org_id: 'org456',
        role: 'admin',
      });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user123');
      expect(result?.iss).toBe('adsengineer');
      expect(result?.aud).toBe('adsengineer-api');
      expect(result?.exp).toBeGreaterThan(now);
    });
  });

  describe('Edge Cases', () => {
    it('rejects malformed token', async () => {
      const result = await jwtService.verifyToken('not-a-jwt');
      expect(result).toBeNull();
    });

    it('rejects token with missing signature part', async () => {
      const validToken = jwtService.createToken({ sub: 'user123', org_id: 'org456' });

      const noSignatureToken = validToken.split('.')[0] + '.' + validToken.split('.')[1];

      const result = jwtService.verifyToken(noSignatureToken);
      expect(result).toBeNull();
    });

    it('handles tokens with extra fields in payload', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = jwtService.createToken({ 
        sub: 'user123',
        customField: 'should be preserved',
        org_id: 'org456',
        exp: now + 3600,
      });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.customField).toBe('should be preserved');
    });
  });
});

  describe('Invalid Signature', () => {
    it('rejects token with invalid HMAC signature', async () => {
      const validToken = jwtService.createToken({ sub: 'user123', org_id: 'org456' });

      // Tamper with the signature by changing one character
      const tamperedToken = validToken.slice(0, -1) + 'X' + validToken.slice(-1);

      const result = jwtService.verifyToken(tamperedToken);
      expect(result).toBeNull();
    });

    it('rejects token with corrupted signature', async () => {
      const validToken = jwtService.createToken({ sub: 'user123', org_id: 'org456' });

      // Remove the signature completely (invalid format)
      const noSignatureToken = validToken.split('.')[0] + '.' + validToken.split('.')[1];

      const result = jwtService.verifyToken(noSignatureToken);
      expect(result).toBeNull();
    });
  });

  describe('Invalid Claims', () => {
    it('rejects token with wrong issuer', async () => {
      const token = jwtService.createToken({ iss: 'attacker', sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });

    it('rejects token with wrong audience', async () => {
      const token = jwtService.createToken({ aud: 'wrong-audience', sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });

    it('rejects expired token', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const token = jwtService.createToken({ exp: expiredTime, sub: 'user123' });

      const result = jwtService.verifyToken(token);
      expect(result).toBeNull();
    });
  });

  describe('Valid Tokens', () => {
    it('accepts valid token with correct signature', async () => {
      const token = jwtService.createToken({ sub: 'user123', org_id: 'org456', role: 'admin' });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user123');
      expect(result?.org_id).toBe('org456');
      expect(result?.role).toBe('admin');
    });

    it('accepts token with all required claims present', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = jwtService.createToken({ 
        sub: 'user123',
        iss: 'adsengineer',
        aud: 'adsengineer-api',
        iat: now - 3600,
        exp: now + 3600,
        org_id: 'org456',
        role: 'admin',
      });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user123');
      expect(result?.iss).toBe('adsengineer');
      expect(result?.aud).toBe('adsengineer-api');
      expect(result?.exp).toBeGreaterThan(now);
    });
  });

  describe('Edge Cases', () => {
    it('rejects malformed token with invalid structure', async () => {
      const result = await jwtService.verifyToken('not-a-jwt');
      expect(result).toBeNull();
    });

    it('rejects token with missing signature part', async () => {
      const result = await jwtService.verifyToken('header.payload');
      expect(result).toBeNull();
    });

    it('handles tokens with extra fields in payload', async () => {
      const token = jwtService.createToken({ 
        sub: 'user123',
        customField: 'should be preserved',
        org_id: 'org456',
      });

      const result = jwtService.verifyToken(token);
      expect(result).not.toBeNull();
      expect(result?.customField).toBe('should be preserved');
    });
  });
});