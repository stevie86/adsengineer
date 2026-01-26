import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDb } from '../../src/database';
import { EncryptionService } from '../../src/services/encryption';

// Mock D1Database
const mockD1 = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue(undefined),
  first: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue({ results: [] }),
};

// Mock the Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: vi.fn().mockImplementation(async (_: any, __: any, _data: Uint8Array) => {
        // Return valid JSON structure for decryption
        const decryptedContent = JSON.stringify({
          apiKey: 'AIzaSyTestApiKey123456789',
          clientId: 'test-client.apps.googleusercontent.com',
          clientSecret: 'test-secret',
          developerToken: 'test-token',
        });
        return new TextEncoder().encode(decryptedContent).buffer;
      }),
    },
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(16)),
  },
  writable: true,
});

describe('Encrypted Credential Storage', () => {
  let db: any;
  let encryptionService: EncryptionService;

  beforeAll(async () => {
    // Reset singleton before tests
    EncryptionService.resetForTesting();
    encryptionService = EncryptionService.getInstance();
    // Use a valid base64-encoded 32-byte key for testing
    const testKey = btoa('test_master_key_12345678901234567890'); // 32 bytes when decoded
    await encryptionService.initialize(testKey);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks(); // Restore spy implementations
    db = createDb(mockD1 as any);
  });

  describe('Credential Encryption', () => {
    it('should encrypt and store Google Ads credentials', async () => {
      const agencyId = 'test-agency-123';
      const credentials = {
        googleAds: {
          apiKey: 'AIzaSyDummyApiKey123456789',
          clientId: 'dummy-client-id.apps.googleusercontent.com',
          clientSecret: 'dummy-client-secret',
          developerToken: 'dummy-developer-token',
        },
      };

      const success = await db.updateAgencyCredentials(agencyId, credentials);

      expect(success).toBe(true);
      expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE agencies'));
      expect(mockD1.bind).toHaveBeenCalled();
      expect(mockD1.run).toHaveBeenCalled();
    });

    it('should encrypt and store Meta credentials', async () => {
      const agencyId = 'test-agency-456';
      const credentials = {
        meta: {
          accessToken: 'dummy-meta-access-token',
          appId: 'dummy-app-id',
          appSecret: 'dummy-app-secret',
        },
      };

      const success = await db.updateAgencyCredentials(agencyId, credentials);

      expect(success).toBe(true);
    });

    it('should encrypt and store Stripe credentials', async () => {
      const agencyId = 'test-agency-789';
      const credentials = {
        stripe: {
          secretKey: 'sk_test_dummy_secret_key',
          publishableKey: 'pk_test_dummy_publishable_key',
        },
      };

      const success = await db.updateAgencyCredentials(agencyId, credentials);

      expect(success).toBe(true);
    });

    it('should handle encryption failures gracefully', async () => {
      // Mock encryption failure
      vi.spyOn(encryptionService, 'encrypt').mockRejectedValue(new Error('Encryption failed'));

      const agencyId = 'test-agency-fail';
      const credentials = {
        googleAds: {
          apiKey: 'test-key',
          clientId: 'test-client',
          clientSecret: 'test-secret',
          developerToken: 'test-token',
        },
      };

      const success = await db.updateAgencyCredentials(agencyId, credentials);

      expect(success).toBe(false);
    });
  });

  describe('Credential Retrieval', () => {
    it('should retrieve and decrypt Google Ads credentials', async () => {
      const agencyId = 'test-agency-retrieve';

      // Generate valid encrypted data
      const validEncryptedData = await encryptionService.encrypt(
        JSON.stringify({
          apiKey: 'AIzaSyTestApiKey123456789',
          clientId: 'test-client.apps.googleusercontent.com',
          clientSecret: 'test-secret',
          developerToken: 'test-token',
        }),
        `agency-${agencyId}-googleAds`
      );

      // Mock database response with valid encrypted data
      mockD1.first.mockResolvedValue({
        google_ads_config: JSON.stringify(validEncryptedData),
      });

      const credentials = await db.getAgencyCredentials(agencyId);

      expect(credentials).toHaveProperty('googleAds');
      expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should handle decryption failures gracefully', async () => {
      const agencyId = 'test-agency-decrypt-fail';

      // Mock database with corrupted encrypted data
      mockD1.first.mockResolvedValue({
        google_ads_config: JSON.stringify({
          encrypted: 'corrupted-data',
          iv: 'corrupted-iv',
          algorithm: 'AES-GCM',
          timestamp: new Date().toISOString(),
        }),
      });

      // Mock decryption failure
      vi.spyOn(encryptionService, 'decrypt').mockRejectedValue(new Error('Decryption failed'));

      const credentials = await db.getAgencyCredentials(agencyId);

      // Should return object without the failed credential
      expect(credentials).toEqual({});
    });

    it('should return null for non-existent agency', async () => {
      mockD1.first.mockResolvedValue(null);

      const credentials = await db.getAgencyCredentials('non-existent-agency');

      expect(credentials).toBeNull();
    });
  });

  describe('Credential Validation', () => {
    it('should validate Google Ads credentials format', async () => {
      const validCreds = {
        apiKey: 'AIzaSyValidApiKey123456789',
        clientId: 'valid-client-id.apps.googleusercontent.com',
        clientSecret: 'valid-client-secret',
        developerToken: 'valid-developer-token',
      };

      const result = await db.validateCredentialFormat('googleAds', validCreds);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid Google Ads API key format', async () => {
      const invalidCreds = {
        apiKey: 'invalid-api-key',
        clientId: 'valid-client-id.apps.googleusercontent.com',
        clientSecret: 'valid-client-secret',
        developerToken: 'valid-developer-token',
      };

      const result = await db.validateCredentialFormat('googleAds', invalidCreds);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Google Ads API key format');
    });

    it('should validate Stripe credentials format', async () => {
      const validCreds = {
        secretKey: 'sk_test_valid_secret_key',
        publishableKey: 'pk_test_valid_publishable_key',
      };

      const result = await db.validateCredentialFormat('stripe', validCreds);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid Stripe key formats', async () => {
      const invalidCreds = {
        secretKey: 'invalid-secret-key',
        publishableKey: 'invalid-publishable-key',
      };

      const result = await db.validateCredentialFormat('stripe', invalidCreds);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Stripe secret key format');
      expect(result.errors).toContain('Invalid Stripe publishable key format');
    });

    it('should reject unknown platforms', async () => {
      const result = await db.validateCredentialFormat('unknown', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown platform: unknown');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full credential lifecycle', async () => {
      const agencyId = 'test-full-lifecycle';
      const originalCreds = {
        googleAds: {
          apiKey: 'AIzaSyTestApiKey123456789', // Must match mock decryption output
          clientId: 'test-client.apps.googleusercontent.com',
          clientSecret: 'test-secret',
          developerToken: 'test-token',
        },
      };

      // Store credentials
      const storeSuccess = await db.updateAgencyCredentials(agencyId, originalCreds);
      expect(storeSuccess).toBe(true);

      // Mock retrieval with valid encrypted data
      const mockEncrypted = await encryptionService.encrypt(
        JSON.stringify(originalCreds.googleAds),
        `agency-${agencyId}-googleAds`
      );
      mockD1.first.mockResolvedValue({
        google_ads_config: JSON.stringify(mockEncrypted),
      });

      // Retrieve and verify
      const retrievedCreds = await db.getAgencyCredentials(agencyId);
      expect(retrievedCreds).toHaveProperty('googleAds');
      expect(retrievedCreds?.googleAds.apiKey).toBe(originalCreds.googleAds.apiKey);
    });
  });
});
