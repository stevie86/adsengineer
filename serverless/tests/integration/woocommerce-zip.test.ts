import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateWooCommercePluginZip } from '../../src/services/woocommerce-zip';

describe('WooCommerce ZIP Generation', () => {
  it('should generate a valid ZIP buffer', async () => {
    const zipBuffer = await generateWooCommercePluginZip();

    // Check that we got a buffer
    expect(zipBuffer).toBeInstanceOf(Uint8Array);
    expect(zipBuffer.byteLength).toBeGreaterThan(0);
  });

  it('should have ZIP file signature', async () => {
    const zipBuffer = await generateWooCommercePluginZip();

    // ZIP files start with PK (0x504B in little-endian)
    const signature = (zipBuffer[0] << 8) | zipBuffer[1];
    expect(signature).toBe(0x504b);
  });

  it('should contain plugin files', async () => {
    const zipBuffer = await generateWooCommercePluginZip();

    // The buffer should be large enough to contain the files
    // PHP file is ~5KB, README is ~1KB, so ZIP should be > 1KB
    expect(zipBuffer.byteLength).toBeGreaterThan(1024);
  });
});
