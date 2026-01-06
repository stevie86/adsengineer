import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService } from '../services/encryption';

const testSecret = 'test-backup-encryption-key';

describe('Backup Encryption Fail-Close', () => {
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    await encryptionService.initialize(testSecret);
  });

  describe('Fail-Close Behavior', () => {
    it('returns 503 when BACKUP_ENCRYPTION_KEY not configured', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup');

      expect(response.status).toBe(503);
      expect(response.status).toBe(503);

      const body = await response.json() as any;
      expect(body.success).toBe(false);
      expect(body.error).toBe('backup_encryption_required');
      expect(body.code).toBe('BACKUP_ENCRYPTION_REQUIRED');
      expect(body.message).toContain('Cannot perform backup without encryption key');
      expect(body.data).toBeUndefined();
      expect(body.encrypted).toBeUndefined();
      expect(body.exported_at).toBeUndefined();
      expect(body.counts).toBeUndefined();
      expect(body.tables).toBeUndefined();
    });

    it('does not include backup data in error response', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup');

      expect(response.status).toBe(503);

      const body = await response.json() as any;
      expect(body.leads).toBeUndefined();
      expect(body.waitlist).toBeUndefined();
      expect(body.optimization_triggers).toBeUndefined();
    expect(body.tables).toBeUndefined();
      expect(body.counts).toBeUndefined();
      expect(body.exported_at).toBeUndefined();
      expect(body.encrypted).toBeUndefined();
    });
  });

  describe('Success Path', () => {
    it('encrypts and returns backup when BACKUP_ENCRYPTION_KEY is configured', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup');

      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.success).toBe(true);
      expect(body.error).toBeUndefined();
      expect(body.exported_at).toBeDefined();
      expect(body.version).toBe('1.0.0');

      expect(body.tables).toBeDefined();
      expect(body.tables.leads).toBeDefined();
      expect(body.tables.waitlist).toBeDefined();
      expect(body.tables.optimization_triggers).toBeDefined();

      expect(body.counts).toBeDefined();
      expect(body.counts.leads).toBeGreaterThan(0);

      expect(body.encrypted).toBeDefined();
      expect(body.encrypted.encrypted).toBeDefined();
      expect(body.encrypted).encrypted.length).toBeGreaterThan(0);

      expect(body.tables.leads[0]).toHaveProperty('id');
      expect(body.tables.leads[0]).toHaveProperty('email');
      expect(body.tables.leads[0]).toHaveProperty('created_at');
    });

    it('returns encrypted backup with correct structure', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup');

      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.encrypted).toBeDefined();
      expect(body.encrypted.encrypted).toBeDefined();
      expect(body.encrypted).iv).toBeDefined();
      expect(body.encrypted.iv.length).toBe(24); // Base64 of 12 bytes
    });
  });

  describe('Decryption Path', () => {
    it('decrypts backup when BACKUP_ENCRYPTION_KEY is configured', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encrypted: 'mock-encrypted-data',
          iv: 'mock-iv',
        }),
      });

      expect(response.status).toBe(200);

      const body = await response.json() as any;
      expect(body.leads).toBeDefined();
      expect(body.waitlist).toBeDefined();
      expect(body.optimization_triggers).toBeDefined();
    });

    it('returns 503 when BACKUP_ENCRYPTION_KEY not configured for decrypt', async () => {
      const response = await fetch('http://localhost:8090/api/v1/admin/backup/decrypt');

      expect(response.status).toBe(503);

      const body = await response.json() as any;
      expect(body.error).toContain('BACKUP_ENCRYPTION_KEY not configured');
      expect(body.leads).toBeUndefined();
    });
  });
});