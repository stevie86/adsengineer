import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GA4MeasurementClient, GA4MeasurementError } from '../../src/services/ga4-measurement';

describe('GA4 Measurement Client', () => {
  let client: GA4MeasurementClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    client = new GA4MeasurementClient({
      measurementId: 'G-TEST123',
      apiSecret: 'test-secret',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendBatch', () => {
    it('should send events successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        clone: () => ({ text: () => Promise.resolve('') }),
      });

      const events = [{ name: 'test_event', params: { value: 100 } }];

      const result = await client.sendBatch(events);

      expect(result.success).toBe(true);
      expect(result.events_sent).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=test-secret',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: [{ name: 'test_event', params: { value: 100 } }],
          }),
        })
      );
    });

    it('should split events into batches of 25', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        clone: () => ({ text: () => Promise.resolve('') }),
      });

      const events = Array.from({ length: 30 }, (_, i) => ({
        name: `event_${i}`,
        params: { value: i },
      }));

      const result = await client.sendBatch(events);

      expect(result.success).toBe(true);
      expect(result.events_sent).toBe(30);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // First batch: 25 events
      expect(JSON.parse(mockFetch.mock.calls[0][1].body).events).toHaveLength(25);
      // Second batch: 5 events
      expect(JSON.parse(mockFetch.mock.calls[1][1].body).events).toHaveLength(5);
    });

    it('should retry up to 3 times on retryable errors', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
            clone: () => ({ text: () => Promise.resolve('Internal Server Error') }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(''),
          clone: () => ({ text: () => Promise.resolve('') }),
        });
      });

      const events = [{ name: 'test_event' }];

      const result = await client.sendBatch(events);

      expect(result.success).toBe(true);
      expect(result.events_sent).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after 3 retries on retryable errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
        clone: () => ({ text: () => Promise.resolve('Internal Server Error') }),
      });

      const events = [{ name: 'test_event' }];

      const result = await client.sendBatch(events);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('GA4 API error: 500 undefined');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
        clone: () => ({ text: () => Promise.resolve('Bad Request') }),
      });

      const events = [{ name: 'test_event' }];

      const result = await client.sendBatch(events);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('GA4 API error: 400 undefined');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error for empty events array', async () => {
      await expect(client.sendBatch([])).rejects.toThrow(GA4MeasurementError);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('sendEvent', () => {
    it('should send single event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        clone: () => ({ text: () => Promise.resolve('') }),
      });

      const result = await client.sendEvent({ name: 'test_event' });

      expect(result.success).toBe(true);
      expect(result.events_sent).toBe(1);
    });
  });
});
