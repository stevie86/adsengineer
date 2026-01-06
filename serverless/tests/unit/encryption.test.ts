import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import {
  EncryptionService,
  encryptCredential,
  decryptCredential,
  initializeEncryption,
} from '../../src/services/encryption';

// Mock the Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
  getRandomValues: vi.fn(),
};

// Replace global crypto with mock
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Create a mock CryptoKey
const mockCryptoKey = {
  type: 'secret',
  extractable: false,
  algorithm: { name: 'AES-GCM', length: 256 },
  usages: ['encrypt', 'decrypt'],
};

describe('Encryption Service', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    // Reset singleton before tests
    EncryptionService.resetForTesting();
    encryptionService = EncryptionService.getInstance();
  });

  beforeEach(() => {
    // Reset all mocks and the singleton
    vi.clearAllMocks();
    EncryptionService.resetForTesting();
    encryptionService = EncryptionService.getInstance();

    // Setup default mock behaviors
    mockCrypto.subtle.importKey.mockResolvedValue(mockCryptoKey);
    mockCrypto.subtle.generateKey.mockResolvedValue(mockCryptoKey);
    mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16)); // Mock IV

    // Mock encryption to return a fixed encrypted result
    const mockEncrypted = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); // 16 bytes
    mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted.buffer);

    // Mock decryption to return the original data
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('test data').buffer);
  });

  describe('Initialization', () => {
    it('should initialize with a valid master key', async () => {
      await expect(encryptionService.initialize('validBase64Key')).resolves.not.toThrow();
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });

    it('should reject invalid master key', async () => {
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Invalid key'));
      await expect(encryptionService.initialize('invalidKey')).rejects.toThrow(
        'Encryption service initialization failed'
      );
    });

    it('should not reinitialize if already initialized', async () => {
      await encryptionService.initialize('key1');
      await encryptionService.initialize('key2');
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('Encryption', () => {
    beforeEach(async () => {
      await encryptionService.initialize('testKey');
    });

    it('should encrypt data successfully', async () => {
      const result = await encryptionService.encrypt('test data');

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('algorithm', 'AES-GCM');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should generate different IVs for each encryption', async () => {
      mockCrypto.getRandomValues
        .mockReturnValueOnce(
          new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
        )
        .mockReturnValueOnce(
          new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
        );

      const result1 = await encryptionService.encrypt('data1');
      const result2 = await encryptionService.encrypt('data2');

      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should fail if not initialized', async () => {
      const freshService = new EncryptionService();
      await expect(freshService.encrypt('test')).rejects.toThrow(
        'Encryption service not initialized'
      );
    });
  });

  describe('Decryption', () => {
    beforeEach(async () => {
      await encryptionService.initialize('testKey');
    });

    it('should decrypt data successfully', async () => {
      const encryptedData = {
        encrypted: btoa('encrypted'),
        iv: btoa('iv'),
        tag: btoa('tag'),
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      const result = await encryptionService.decrypt(encryptedData);
      expect(result).toBe('test data');
    });

    it('should fail with invalid encrypted data structure', async () => {
      const invalidData = {
        encrypted: 'invalid',
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
        // Missing iv
      };

      await expect(encryptionService.decrypt(invalidData as any)).rejects.toThrow();
    });

    it('should fail if not initialized', async () => {
      const freshService = new EncryptionService();
      const encryptedData = {
        encrypted: 'test',
        iv: 'test',
        tag: 'test',
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      await expect(freshService.decrypt(encryptedData)).rejects.toThrow(
        'Encryption service not initialized'
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate correct encrypted data', () => {
      const validData = {
        encrypted: btoa('data'),
        iv: btoa('iv'),
        tag: btoa('tag'),
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      expect(encryptionService.validateEncryptedData(validData)).toBe(true);
    });

    it('should reject invalid algorithm', () => {
      const invalidData = {
        encrypted: btoa('data'),
        iv: btoa('iv'),
        algorithm: 'AES-CBC', // Wrong algorithm
        timestamp: new Date().toISOString(),
      };

      expect(encryptionService.validateEncryptedData(invalidData)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        encrypted: btoa('data'),
        // Missing iv
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      expect(encryptionService.validateEncryptedData(invalidData)).toBe(false);
    });

    it('should reject invalid base64', () => {
      const invalidData = {
        encrypted: 'invalid-base64!',
        iv: btoa('iv'),
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      expect(encryptionService.validateEncryptedData(invalidData)).toBe(false);
    });
  });

  describe('Key Management', () => {
    it('should generate new encryption keys', async () => {
      const key = await encryptionService.generateNewKey();

      expect(key).toHaveProperty('id');
      expect(key).toHaveProperty('key');
      expect(key).toHaveProperty('created');
      expect(key).toHaveProperty('active', true);
      expect(key).toHaveProperty('version');
      expect(typeof key.id).toBe('string');
      expect(key.created).toBeInstanceOf(Date);
    });

    it('should get health status', () => {
      const status = encryptionService.getHealthStatus();

      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('algorithm', 'AES-GCM');
      expect(status).toHaveProperty('keyLength', 256);
      expect(status).toHaveProperty('cachedKeys');
      expect(typeof status.cachedKeys).toBe('number');
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(async () => {
      await initializeEncryption('testKey');
    });

    it('should encrypt via convenience function', async () => {
      const result = await encryptCredential('test data');
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('algorithm', 'AES-GCM');
    });

    it('should decrypt via convenience function', async () => {
      const encryptedData = {
        encrypted: btoa('encrypted'),
        iv: btoa('iv'),
        tag: btoa('tag'),
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
      };

      const result = await decryptCredential(encryptedData);
      expect(result).toBe('test data');
    });
  });
});
