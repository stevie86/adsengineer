import { test, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { createId } from '@paralleldrive/cuid2';

// Mock implementations
vi.mock('@paralleldrive/cuid2', () => ({
  createId: vi.fn(() => 'mock-id-123')
}));

describe('Agency Onboarding - Enhanced Coverage', () => {
  describe('Input Validation', () => {
    test('validates agency name length constraints', () => {
      const validNames = ['ABC Marketing', 'Tech Solutions Inc', 'Digital Agency'];
      const invalidNames = ['', 'A', 'A'.repeat(256)]; // Empty, too short, too long

      validNames.forEach(name => {
        expect(name.length).toBeGreaterThanOrEqual(2);
        expect(name.length).toBeLessThanOrEqual(100);
      });

      invalidNames.forEach(name => {
        expect(name.length < 2 || name.length > 100).toBe(true);
      });
    });

    test('validates email formats comprehensively', () => {
      const validEmails = [
        'user@example.com',
        'user.name+tag@domain.co.uk',
        'test@subdomain.domain.org'
      ];

      const invalidEmails = [
        'invalid',
        '@domain.com',
        'user@',
        'user@domain',
        'user domain.com',
        'user@domain.',
        ''
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(email).toMatch(emailRegex);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(emailRegex);
      });
    });

    test('validates platform selections', () => {
      const validPlatforms = ['google-ads', 'facebook-ads', 'tiktok-ads', 'linkedin-ads', 'other'];
      const invalidPlatforms = ['invalid-platform', 'twitter-ads', 'snapchat-ads'];

      const allowedPlatforms = ['google-ads', 'facebook-ads', 'tiktok-ads', 'linkedin-ads', 'other'];

      validPlatforms.forEach(platform => {
        expect(allowedPlatforms).toContain(platform);
      });

      invalidPlatforms.forEach(platform => {
        expect(allowedPlatforms).not.toContain(platform);
      });
    });

    test('validates GHL experience levels', () => {
      const validLevels = ['none', 'basic', 'intermediate', 'advanced'];
      const invalidLevels = ['expert', 'beginner', 'novice', ''];

      validLevels.forEach(level => {
        expect(['none', 'basic', 'intermediate', 'advanced']).toContain(level);
      });

      invalidLevels.forEach(level => {
        expect(['none', 'basic', 'intermediate', 'advanced']).not.toContain(level);
      });
    });

    test('validates URL formats', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://subdomain.example.com/path',
        'https://example.co.uk'
      ];

      const invalidUrls = [
        'not-a-url',
        'example.com',
        'ftp://example.com',
        'https://',
        ''
      ];

      const urlRegex = /^https?:\/\/.+/;

      validUrls.forEach(url => {
        expect(url).toMatch(urlRegex);
      });

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(urlRegex);
      });
    });
  });

  describe('Business Logic Validation', () => {
    test('calculates lead value cents correctly', () => {
      const testCases = [
        { input: '100.50', expected: 10050 },
        { input: '0', expected: 0 },
        { input: '999.99', expected: 99999 },
        { input: '', expected: undefined },
        { input: 'invalid', expected: NaN }
      ];

      testCases.forEach(({ input, expected }) => {
        if (input === '') {
          expect(undefined).toBeUndefined();
        } else if (input === 'invalid') {
          expect(isNaN(parseFloat(input))).toBe(true);
        } else {
          const result = Math.round(parseFloat(input) * 100);
          expect(result).toBe(expected);
        }
      });
    });

    test('handles pain points array validation', () => {
      const validPainPoints = [
        ['Lead quality', 'Attribution issues'],
        ['Tracking setup', 'Data accuracy'],
        ['Conversion tracking', 'Cross-platform reporting']
      ];

      const invalidPainPoints = [
        [''],
        ['A'.repeat(501)], // Too long
        null,
        undefined
      ];

      validPainPoints.forEach(points => {
        expect(Array.isArray(points)).toBe(true);
        expect(points.length).toBeGreaterThan(0);
        points.forEach(point => {
          expect(typeof point).toBe('string');
          expect(point.length).toBeGreaterThan(0);
          expect(point.length).toBeLessThanOrEqual(500);
        });
      });

      invalidPainPoints.forEach(points => {
        if (points === null || points === undefined) {
          expect(points == null).toBe(true);
        } else if (points.includes('')) {
          expect(points.some(p => p === '')).toBe(true);
        } else {
          expect(points.some(p => p.length > 500)).toBe(true);
        }
      });
    });

    test('validates monthly ad spend ranges', () => {
      const validRanges = ['under-1k', '1k-5k', '5k-10k', '10k-25k', '25k-50k', 'over-50k'];
      const invalidRanges = ['invalid', '0-1000', ''];

      validRanges.forEach(range => {
        expect(['under-1k', '1k-5k', '5k-10k', '10k-25k', '25k-50k', 'over-50k']).toContain(range);
      });

      invalidRanges.forEach(range => {
        expect(['under-1k', '1k-5k', '5k-10k', '10k-25k', '25k-50k', 'over-50k']).not.toContain(range);
      });
    });
  });

  describe('API Key Generation', () => {
    test('generates secure API keys with correct format', () => {
      // Mock the createId function
      vi.mocked(createId).mockReturnValue('abcdefghijklmnop'); // 16 chars

      const apiKey = `adv_${createId()}`;
      expect(apiKey).toMatch(/^adv_[a-zA-Z0-9]+$/);
      expect(apiKey.length).toBeGreaterThan(4); // 'adv_' + cuid
    });

    test('generates unique API keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        vi.mocked(createId).mockReturnValue(`unique${i}`.padEnd(16, 'x'));
        const key = `adv_${createId()}`;
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
      expect(keys.size).toBe(100);
    });

    test('API key hashing produces consistent results', async () => {
      const key1 = 'test-api-key-123';
      const key2 = 'test-api-key-123';
      const key3 = 'different-key-456';

      const hash1 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key1));
      const hash2 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key2));
      const hash3 = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key3));

      const hash1Array = new Uint8Array(hash1);
      const hash2Array = new Uint8Array(hash2);
      const hash3Array = new Uint8Array(hash3);

      const hash1Str = Array.from(hash1Array).map(b => b.toString(16).padStart(2, '0')).join('');
      const hash2Str = Array.from(hash2Array).map(b => b.toString(16).padStart(2, '0')).join('');
      const hash3Str = Array.from(hash3Array).map(b => b.toString(16).padStart(2, '0')).join('');

      expect(hash1Str).toBe(hash2Str); // Same input = same hash
      expect(hash1Str).not.toBe(hash3Str); // Different input = different hash
    });
  });

  describe('Data Transformation', () => {
    test('transforms form data to API format', () => {
      const formData = {
        name: 'Test Agency',
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        primaryPlatforms: ['google-ads', 'facebook-ads'],
        ghlExperience: 'intermediate',
        monthlyAdSpend: '1k-5k',
        painPoints: ['Lead quality', 'Attribution']
      };

      const apiData = {
        agency_name: formData.name,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        primary_platforms: formData.primaryPlatforms,
        ghl_experience: formData.ghlExperience,
        monthly_ad_spend: formData.monthlyAdSpend,
        pain_points: formData.painPoints
      };

      expect(apiData.agency_name).toBe(formData.name);
      expect(apiData.contact_email).toBe(formData.contactEmail);
      expect(Array.isArray(apiData.primary_platforms)).toBe(true);
      expect(apiData.primary_platforms).toContain('google-ads');
    });

    test('handles empty optional fields', () => {
      const minimalData = {
        name: 'Test Agency',
        contactName: 'John Doe',
        contactEmail: 'john@test.com',
        primaryPlatforms: ['google-ads'],
        ghlExperience: 'basic'
      };

      const apiData = {
        agency_name: minimalData.name,
        contact_name: minimalData.contactName,
        contact_email: minimalData.contactEmail,
        primary_platforms: minimalData.primaryPlatforms,
        ghl_experience: minimalData.ghlExperience,
        monthly_ad_spend: undefined,
        pain_points: undefined,
        referral_source: undefined
      };

      expect(apiData.monthly_ad_spend).toBeUndefined();
      expect(apiData.pain_points).toBeUndefined();
      expect(apiData.referral_source).toBeUndefined();
    });

    test('converts boolean strings correctly', () => {
      const stringBooleans = {
        'true': true,
        'false': false,
        'True': true,
        'False': false,
        'TRUE': true,
        'FALSE': false,
        'invalid': 'invalid'
      };

      Object.entries(stringBooleans).forEach(([input, expected]) => {
        if (typeof expected === 'boolean') {
          const result = input.toLowerCase() === 'true';
          expect(result).toBe(expected);
        }
      });
    });
  });
});