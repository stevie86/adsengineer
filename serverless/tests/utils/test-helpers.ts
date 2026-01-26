import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

// Test utilities for generating test data
export class TestDataGenerator {
  static generateAgencyData(overrides = {}) {
    return {
      name: faker.company.name(),
      contactName: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      companyWebsite: faker.internet.url(),
      phone: faker.phone.number(),
      monthlyAdSpend: faker.helpers.arrayElement([
        'under-1k',
        '1k-5k',
        '5k-10k',
        '10k-25k',
        '25k-50k',
        'over-50k',
      ]),
      primaryPlatforms: faker.helpers.arrayElements(
        ['google-ads', 'facebook-ads', 'tiktok-ads', 'linkedin-ads', 'other'],
        faker.number.int({ min: 1, max: 3 })
      ),
      ghlExperience: faker.helpers.arrayElement(['none', 'basic', 'intermediate', 'advanced']),
      painPoints: faker.helpers.arrayElements(
        ['Tracking setup', 'Attribution issues', 'Cross-platform reporting', 'Lead quality'],
        faker.number.int({ min: 0, max: 3 })
      ),
      referralSource: faker.helpers.arrayElement([
        'google',
        'linkedin',
        'referral',
        'conference',
        null,
      ]),
      ...overrides,
    };
  }

  static generateLeadData(agencyId = null, overrides = {}) {
    return {
      agency_id: agencyId || faker.string.uuid(),
      agency_name: faker.company.name(),
      website: faker.internet.url(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      lead_source: faker.helpers.arrayElement(['hunter-army', 'manual', 'referral', 'webinar']),
      ghl_detected: faker.datatype.boolean(),
      tracking_broken: faker.datatype.boolean(),
      lead_value_cents: faker.number.int({ min: 0, max: 100000 }),
      notes: faker.lorem.sentence(),
      ...overrides,
    };
  }

  static generateApiKey() {
    return `adv_${faker.string.alphanumeric(24)}`;
  }
}

// Global test setup
beforeAll(async () => {
  // Setup test environment
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test environment
  console.log('Cleaning up test environment...');
});

// Helper functions for tests
export const testHelpers = {
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await testHelpers.wait(delay);
      }
    }
  },

  expectApiResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toBeDefined();

    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.data.success).toBe(true);
    }
  },
};

describe('Test Infrastructure', () => {
  test('TestDataGenerator produces valid data', () => {
    const agency = TestDataGenerator.generateAgencyData();
    const lead = TestDataGenerator.generateLeadData();

    expect(agency.name).toBeDefined();
    expect(agency.contactEmail).toMatch(/@/);
    expect(Array.isArray(agency.primaryPlatforms)).toBe(true);

    expect(lead.agency_name).toBeDefined();
    expect(lead.lead_source).toBeDefined();
  });

  test('API key format is correct', () => {
    const key = TestDataGenerator.generateApiKey();
    expect(key).toMatch(/^adv_[a-zA-Z0-9]{24}$/);
  });

  test('test helpers work correctly', async () => {
    const result = await testHelpers.retry(() => Promise.resolve('success'));
    expect(result).toBe('success');

    let attempts = 0;
    try {
      await testHelpers.retry(
        () => {
          attempts++;
          if (attempts < 3) throw new Error('fail');
          return 'success';
        },
        3,
        10
      );
    } catch (error) {
      // Should not reach here
    }
    expect(attempts).toBe(3);
  });
});
