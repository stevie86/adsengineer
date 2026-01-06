import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isValidGCLID, hashGCLID, redactGCLID } from '../../src/utils/gclid';

describe('GCLID Utilities - Shopify MVP', () => {
  describe('isValidGCLID', () => {
    it('should validate correct GCLIDs', () => {
      expect(isValidGCLID('GCLID_AbCdEfGhIjKlMnOpQrStUvWxYz123456')).toBe(true);
      expect(isValidGCLID('GCLID_abc123_def456-ghi789')).toBe(true);
      expect(isValidGCLID('GCLID_12345678901234567890123456')).toBe(true);
    });

    it('should reject invalid GCLIDs', () => {
      expect(isValidGCLID(null)).toBe(false);
      expect(isValidGCLID(undefined)).toBe(false);
      expect(isValidGCLID('')).toBe(false);
      expect(isValidGCLID('gclid_xxx')).toBe(false); // lowercase prefix
      expect(isValidGCLID('GCLID_short')).toBe(false); // too short
      expect(isValidGCLID('GCLID_')).toBe(false); // empty after prefix
    });
  });

  describe('hashGCLID', () => {
    it('should hash GCLID to SHA-256 hex string', async () => {
      const hash = await hashGCLID('GCLID_Test12345678901234567890123');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes for same input', async () => {
      const gclid = 'GCLID_ConsistentTest123456789012345';
      const hash1 = await hashGCLID(gclid);
      const hash2 = await hashGCLID(gclid);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await hashGCLID('GCLID_First1234567890123456789');
      const hash2 = await hashGCLID('GCLID_Second123456789012345678');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('redactGCLID', () => {
    it('should redact long GCLIDs', () => {
      // First 8 chars + ... + last 4 chars
      // GCLID_AbCdEfGhIjKlMnOpQrStUvWxYz123 (40 chars) -> GCLID_Ab...z123
      expect(redactGCLID('GCLID_AbCdEfGhIjKlMnOpQrStUvWxYz123')).toBe('GCLID_Ab...z123');
    });

    it('should redact short GCLIDs', () => {
      expect(redactGCLID('GCLID_123')).toBe('****');
    });

    it('should handle edge cases', () => {
      expect(redactGCLID('')).toBe('****');
    });
  });

  describe('Shopify GCLID Extraction Flow', () => {
    it('should handle complete GCLID flow', async () => {
      const rawGclid = 'GCLID_ShopifyTest123456789012345678';

      // Validate
      expect(isValidGCLID(rawGclid)).toBe(true);

      // Hash for storage
      const hash = await hashGCLID(rawGclid);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);

      // Redact for logs
      const redacted = redactGCLID(rawGclid);
      expect(redacted).toBe('GCLID_Sh...5678');
    });
  });
});

describe('Shopify Webhook GCLID Extraction', () => {
  // Simulate the extractGCLID logic from shopify.ts
  async function extractGCLIDFromOrder(order: any): Promise<string | null> {
    // Check note_attributes first
    if (order.note_attributes) {
      const gclidAttr = order.note_attributes.find((attr: any) => attr.name === 'gclid');
      if (gclidAttr && isValidGCLID(gclidAttr.value)) {
        return gclidAttr.value;
      }
    }

    // Check tags
    if (order.tags) {
      for (const tag of order.tags) {
        if (tag.startsWith('gclid:')) {
          const gclid = tag.replace('gclid:', '');
          if (isValidGCLID(gclid)) {
            return gclid;
          }
        }
      }
    }

    // Check landing_site
    if (order.landing_site) {
      try {
        const url = new URL(order.landing_site);
        const gclid = url.searchParams.get('gclid');
        if (gclid && isValidGCLID(gclid)) {
          return gclid;
        }
      } catch {
        // Invalid URL
      }
    }

    return null;
  }

  it('should extract GCLID from note_attributes (JS snippet)', async () => {
    const order = {
      id: 123,
      email: 'customer@example.com',
      landing_site: 'https://mycannaby.de/checkout',
      note_attributes: [
        { name: 'gclid', value: 'GCLID_FromJS_abcdefghijklmnopqrstuvwxyz' },
      ],
    };

    const gclid = await extractGCLIDFromOrder(order);
    expect(gclid).toBe('GCLID_FromJS_abcdefghijklmnopqrstuvwxyz');
  });

  it('should extract GCLID from tags', async () => {
    const order = {
      id: 123,
      email: 'customer@example.com',
      tags: ['color:green', 'gclid:GCLID_FromTags_abcdefghijklmnopqr', 'size:medium'],
    };

    const gclid = await extractGCLIDFromOrder(order);
    expect(gclid).toBe('GCLID_FromTags_abcdefghijklmnopqr');
  });

  it('should extract GCLID from landing_site query params', async () => {
    const order = {
      id: 123,
      email: 'customer@example.com',
      landing_site: 'https://mycannaby.de/checkout?gclid=GCLID_FromURL_abcdefghijkl',
    };

    const gclid = await extractGCLIDFromOrder(order);
    expect(gclid).toBe('GCLID_FromURL_abcdefghijkl');
  });

  it('should return null when no GCLID present', async () => {
    const order = {
      id: 123,
      email: 'customer@example.com',
      landing_site: 'https://mycannaby.de/checkout',
    };

    const gclid = await extractGCLIDFromOrder(order);
    expect(gclid).toBeNull();
  });

  it('should complete full storage flow with hashing', async () => {
    const order = {
      id: 123,
      email: 'test@mycannaby.de',
      landing_site: 'https://mycannaby.de/products?gclid=GCLID_MyCannabyDemo123456789012',
      note_attributes: [],
      tags: [],
    };

    const gclid = await extractGCLIDFromOrder(order);
    expect(gclid).toBe('GCLID_MyCannabyDemo123456789012');

    // Hash for storage
    const hash = await hashGCLID(gclid!);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Verify we can use hash for storage
    expect(hash.length).toBe(64);
  });
});
