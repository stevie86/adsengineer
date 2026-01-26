import type { Context } from 'hono';

// Encryption key management for API credentials
export interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'AES-CBC';
  keyLength: 256;
  ivLength: 16;
  tagLength: 128;
}

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  tag?: string; // Base64 encoded authentication tag (for GCM)
  algorithm: string;
  timestamp: string; // ISO timestamp of encryption
}

export interface EncryptionKey {
  id: string;
  key: CryptoKey;
  created: Date;
  active: boolean;
  version: number;
}

/**
 * Enterprise-grade encryption service for API credentials
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private keyCache = new Map<string, EncryptionKey>();
  private readonly config: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 16,
    tagLength: 128,
  };

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Reset the singleton for testing purposes only
   */
  static resetForTesting(): void {
    EncryptionService.instance = null as any;
  }

  /**
   * Initialize the encryption service with master key
   */
  async initialize(masterKeySecret: string): Promise<void> {
    if (this.masterKey) {
      console.warn('Encryption service already initialized');
      return;
    }

    try {
      // Import the master key from base64-encoded secret
      const keyData = Uint8Array.from(atob(masterKeySecret), (c) => c.charCodeAt(0));
      this.masterKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      console.log('✅ Encryption service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Encrypt sensitive data using authenticated encryption
   */
  async encrypt(plainText: string, context?: string): Promise<EncryptedData> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      // Generate a random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: this.config.tagLength,
        },
        this.masterKey,
        data
      );

      // Split encrypted data and authentication tag
      const encryptedArray = new Uint8Array(encrypted);
      const ciphertext = encryptedArray.slice(0, -16); // Remove auth tag
      const tag = encryptedArray.slice(-16); // Extract auth tag

      const result: EncryptedData = {
        encrypted: uint8ArrayToBase64(ciphertext),
        iv: uint8ArrayToBase64(iv),
        tag: uint8ArrayToBase64(tag),
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString(),
      };

      console.log(`🔐 Encrypted data with context: ${context || 'unknown'}`);
      return result;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt data with authentication verification
   */
  async decrypt(encryptedData: EncryptedData, context?: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Decode base64 data
      const encrypted = base64ToUint8Array(encryptedData.encrypted);
      const iv = base64ToUint8Array(encryptedData.iv);
      const tag = encryptedData.tag ? base64ToUint8Array(encryptedData.tag) : null;

      // Reconstruct the encrypted data with auth tag
      const fullEncrypted = new Uint8Array(encrypted.length + (tag?.length || 0));
      fullEncrypted.set(encrypted);
      if (tag) {
        fullEncrypted.set(tag, encrypted.length);
      }

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: this.config.tagLength,
        },
        this.masterKey,
        fullEncrypted
      );

      const decoder = new TextDecoder();
      const plainText = decoder.decode(decrypted);

      console.log(`🔓 Decrypted data with context: ${context || 'unknown'}`);
      return plainText;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Data decryption failed - possible tampering or key mismatch');
    }
  }

  /**
   * Generate a new encryption key for key rotation
   */
  async generateNewKey(): Promise<EncryptionKey> {
    try {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable for backup
        ['encrypt', 'decrypt']
      );

      const encryptionKey: EncryptionKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        key: key,
        created: new Date(),
        active: true,
        version: this.keyCache.size + 1,
      };

      this.keyCache.set(encryptionKey.id, encryptionKey);
      console.log(`🗝️ Generated new encryption key: ${encryptionKey.id}`);

      return encryptionKey;
    } catch (error) {
      console.error('❌ Key generation failed:', error);
      throw new Error('Encryption key generation failed');
    }
  }

  /**
   * Validate encrypted data integrity without decrypting
   */
  validateEncryptedData(encryptedData: EncryptedData): boolean {
    try {
      // Check required fields
      if (!encryptedData.encrypted || !encryptedData.iv || !encryptedData.algorithm) {
        return false;
      }

      // Validate algorithm
      if (encryptedData.algorithm !== this.config.algorithm) {
        return false;
      }

      // Validate base64 encoding
      try {
        atob(encryptedData.encrypted);
        atob(encryptedData.iv);
        if (encryptedData.tag) atob(encryptedData.tag);
      } catch {
        return false;
      }

      // Validate timestamp
      const timestamp = new Date(encryptedData.timestamp);
      if (isNaN(timestamp.getTime())) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption service health status
   */
  getHealthStatus(): {
    initialized: boolean;
    algorithm: string;
    keyLength: number;
    cachedKeys: number;
  } {
    return {
      initialized: this.masterKey !== null,
      algorithm: this.config.algorithm,
      keyLength: this.config.keyLength,
      cachedKeys: this.keyCache.size,
    };
  }
}

// Helper function to convert Uint8Array to base64 safely
function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array safely
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper functions that always get the current singleton instance
export const encryptCredential = async (
  credential: string,
  context?: string
): Promise<EncryptedData> => {
  const service = EncryptionService.getInstance();
  return await service.encrypt(credential, context);
};

export const decryptCredential = async (
  encryptedData: EncryptedData,
  context?: string
): Promise<string> => {
  const service = EncryptionService.getInstance();
  return await service.decrypt(encryptedData, context);
};

export const initializeEncryption = async (masterKeySecret: string): Promise<void> => {
  const service = EncryptionService.getInstance();
  await service.initialize(masterKeySecret);
};

/**
 * Hono middleware to initialize encryption service
 */
export const encryptionMiddleware = async (c: Context, next: any) => {
  const encryptionKey = c.env.ENCRYPTION_MASTER_KEY;
  if (!encryptionKey) {
    console.warn('⚠️ ENCRYPTION_MASTER_KEY not found - encryption disabled');
    return next();
  }

  try {
    await initializeEncryption(encryptionKey);
  } catch (error) {
    console.error('❌ Encryption middleware initialization failed:', error);
    // Don't fail the request, just log the error
  }

  return next();
};
