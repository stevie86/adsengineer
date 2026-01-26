import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversionRouter } from '../../src/services/conversion-router';

describe('Conversion Router - Secondary Routing', () => {
  let mockDb: any;
  let router: ConversionRouter;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(() => ({
            id: 'mycannaby-mk059g16',
            name: 'mycannaby',
            google_ads_config: JSON.stringify({
              clientId: 'test-client-id',
              clientSecret: 'test-client-secret',
              developerToken: 'test-developer-token',
              customerId: '123-456-7890',
              conversionActionId: '123456789',
            }),
            secondary_google_ads_config: JSON.stringify({
              customerId: '987-654-3210',
              conversionActionId: '987654321',
            }),
          })),
        })),
      })),
    };

    router = new ConversionRouter(mockDb);
  });

  it('should detect parallel mode when secondary config exists', async () => {
    const conversions = [
      {
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        conversion_value: 45.0,
        conversion_time: '2026-01-01T12:00:00Z',
        order_id: 'order-123',
        agency_id: 'mycannaby-mk059g16',
        currency: 'EUR',
      },
    ];

    const result = await router.routeConversions(conversions);

    expect(result.mode).toBe('parallel');
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeDefined();
  });

  it('should detect single mode when secondary config is missing', async () => {
    mockDb.prepare.mockReturnValue({
      bind: vi.fn(() => ({
        first: vi.fn(() => ({
          id: 'mycannaby-mk059g16',
          name: 'mycannaby',
          google_ads_config: JSON.stringify({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            developerToken: 'test-developer-token',
            customerId: '123-456-7890',
            conversionActionId: '123456789',
          }),
          secondary_google_ads_config: null,
        })),
      })),
    });

    const conversions = [
      {
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        conversion_value: 45.0,
        conversion_time: '2026-01-01T12:00:00Z',
        order_id: 'order-123',
        agency_id: 'mycannaby-mk059g16',
        currency: 'EUR',
      },
    ];

    const result = await router.routeConversions(conversions);

    expect(result.mode).toBe('single');
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeNull();
  });

  it('should filter conversions by GCLID for Google Ads routing', async () => {
    const conversions = [
      {
        gclid: 'EAIaIQv3i3m8e7vOZ-1572532743',
        conversion_value: 45.0,
        conversion_time: '2026-01-01T12:00:00Z',
        agency_id: 'mycannaby-mk059g16',
        currency: 'EUR',
      },
      {
        fbclid: 'fbclid_123',
        conversion_value: 35.0,
        conversion_time: '2026-01-01T12:05:00Z',
        agency_id: 'mycannaby-mk059g16',
        currency: 'EUR',
      },
    ];

    const result = await router.routeConversions(conversions);

    expect(result.mode).toBe('parallel');
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeDefined();
  });

  it('should handle missing agency gracefully', async () => {
    const mockDbForMissing = {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn(() => null), // Return null for missing agency
        })),
      })),
    };

    const routerWithMissing = new ConversionRouter(mockDbForMissing);

    const conversions = [
      {
        gclid: 'test-gclid',
        conversion_value: 45.0,
        conversion_time: '2026-01-01T12:00:00Z',
        agency_id: 'nonexistent-agency',
        currency: 'EUR',
      },
    ];

    const result = await routerWithMissing.routeConversions(conversions);

    expect(result).toEqual({ error: 'Agency not found' });
  });

  it('should handle missing agency ID gracefully', async () => {
    const conversions = [
      {
        gclid: 'test-gclid',
        conversion_value: 45.0,
        conversion_time: '2026-01-01T12:00:00Z',
        currency: 'EUR',
      },
    ];

    const result = await router.routeConversions(conversions);

    expect(result).toEqual({ error: 'No agency ID provided' });
  });
});
