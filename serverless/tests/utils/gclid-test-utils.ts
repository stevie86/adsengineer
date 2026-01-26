/**
 * GCLID Test Utilities
 *
 * Generate valid GCLIDs for testing
 * Simulate GCLID processing flow
 */

import { crypto } from 'crypto';

/**
 * Generate a valid GCLID for testing
 * Format: GCLID_ + 22-40 alphanumeric chars and underscores/hyphens
 */
export function generateTestGCLID(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = 'GCLID_';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate multiple GCLIDs for batch testing
 */
export function generateGCLIDs(count: number, length: number = 32): string[] {
  return Array.from({ length: count }, () => generateTestGCLID(length));
}

/**
 * Generate GCLID with specific characteristics
 */
export function generateSpecialGCLID(
  type: 'underscore-heavy' | 'hyphen-heavy' | 'numeric' | 'mixed'
): string {
  switch (type) {
    case 'underscore-heavy':
      return 'GCLID_' + '_'.repeat(10) + 'abc123' + '_'.repeat(10);
    case 'hyphen-heavy':
      return 'GCLID_' + '-'.repeat(10) + 'abc123' + '-'.repeat(10);
    case 'numeric':
      return 'GCLID_1234567890123456789012345';
    case 'mixed':
      return 'GCLID_abc-def_ghi-jkl_mno-pqr';
    default:
      return generateTestGCLID();
  }
}

/**
 * Generate invalid GCLIDs for negative testing
 */
export const INVALID_GCLIDS = [
  null,
  undefined,
  '',
  'invalid',
  'gclid_short', // No prefix
  'GCLID_short', // Too short
  'GCLID_' + 'a'.repeat(50), // Too long
  'GCLID_test<script>alert(1)</script>', // XSS attempt
  "GCLID_test' OR 1=1--", // SQL injection attempt
  'GCLID_../../etc/passwd', // Path traversal
  '123456789012345678901234', // No prefix
  'EAIaIQv3i3m8e7vOZ-1572532743', // Fake but looks real (wrong prefix)
];

/**
 * Simulate lead with GCLID for testing
 */
export interface TestLead {
  id?: string;
  site_id: string;
  gclid: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  email: string;
  phone?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at?: string;
}

/**
 * Generate a test lead with valid GCLID
 */
export function createTestLead(overrides: Partial<TestLead> = {}): TestLead {
  return {
    id: crypto.randomUUID(),
    site_id: 'test-site-' + Math.random().toString(36).substring(7),
    gclid: generateTestGCLID(),
    email: `test-${Date.now()}@example.com`,
    phone: '+1234567890',
    landing_page: 'https://example.com/landing',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'test-campaign',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create batch of test leads
 */
export function createTestLeads(
  count: number,
  options: {
    withGCLID?: boolean;
    withValidGCLID?: boolean;
    mixedValidInvalid?: boolean;
  } = {}
): TestLead[] {
  const { withGCLID = true, withValidGCLID = true, mixedValidInvalid = false } = options;

  const leads: TestLead[] = [];

  for (let i = 0; i < count; i++) {
    let gclid: string | null = null;

    if (withGCLID) {
      if (mixedValidInvalid && i % 3 === 0) {
        gclid = 'INVALID_GCLID'; // Invalid for testing
      } else if (withValidGCLID) {
        gclid = generateTestGCLID();
      } else {
        gclid = generateSpecialGCLID('underscore-heavy');
      }
    }

    leads.push(createTestLead({ gclid, email: `test-${i}-${Date.now()}@example.com` }));
  }

  return leads;
}

/**
 * Simulate GHL webhook payload with GCLID
 */
export function createGHLWebhookPayload(overrides: Record<string, any> = {}) {
  return {
    contact_id: 'contact_' + crypto.randomUUID().substring(0, 8),
    location_id: 'loc_' + crypto.randomUUID().substring(0, 8),
    email: `lead-${Date.now()}@example.com`,
    phone: '+1234567890',
    gclid: generateTestGCLID(),
    tags: ['qualified', 'high-value'],
    custom_fields: {
      budget: '15000',
      company: 'Test Company',
    },
    source: 'google_ads',
    ...overrides,
  };
}

/**
 * Simulate Shopify webhook payload with GCLID
 */
export function createShopifyWebhookPayload(overrides: Record<string, any> = {}) {
  return {
    id: crypto.randomUUID().substring(0, 8),
    email: `customer-${Date.now()}@example.com`,
    phone: '+1234567890',
    tags: ['gclid:' + generateTestGCLID(), 'utm_source:google'],
    landing_site: 'https://example.com/shop?utm_source=google',
    ...overrides,
  };
}

/**
 * Mock fetch for testing GCLID validation without network
 */
export function createMockGCLIDContext(overrides: Record<string, any> = {}) {
  return {
    req: {
      header: (name: string) => {
        if (name === 'Authorization') return 'Bearer test-token';
        if (name === 'Content-Type') return 'application/json';
        return undefined;
      },
      json: async () => ({ ...overrides }),
      text: async () => JSON.stringify({ ...overrides }),
    },
    env: {
      JWT_SECRET: 'test-secret',
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => null,
            all: async () => ({ results: [] }),
            run: async () => ({ success: true }),
          }),
        }),
        insertLead: async (data: any) => ({ id: crypto.randomUUID() }),
      },
    },
    set: () => undefined,
    get: () => ({
      user_id: 'test-user',
      org_id: 'test-org',
      role: 'admin',
    }),
    json: (data: any, _status?: number) => ({ data, status: _status || 200 }),
    header: () => undefined,
  };
}

/**
 * Test GCLID validation directly
 */
export async function testGCLIDValidation(gclid: string | null | undefined): Promise<{
  valid: boolean;
  sanitized: string | null;
  error?: string;
}> {
  // Import validation from utils (will be created)
  try {
    // Dynamic import to avoid issues if file doesn't exist yet
    const { isValidGCLID, sanitizeGCLID } = await import('./gclid.js');

    const valid = isValidGCLID(gclid);
    const sanitized = sanitizeGCLID(gclid);

    if (!gclid) {
      return { valid: false, sanitized: null, error: 'GCLID is null or undefined' };
    }
    if (typeof gclid !== 'string') {
      return { valid: false, sanitized: null, error: 'GCLID is not a string' };
    }
    if (!valid) {
      return { valid: false, sanitized: null, error: 'Invalid GCLID format' };
    }

    return { valid: true, sanitized };
  } catch (error) {
    return {
      valid: false,
      sanitized: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run GCLID validation test suite
 */
export async function runGCLIDValidationTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{ gclid: any; result: ReturnType<typeof testGCLIDValidation> }>;
}> {
  const results: Array<{ gclid: any; result: ReturnType<typeof testGCLIDValidation> }> = [];
  let passed = 0;
  let failed = 0;

  // Test valid GCLIDs
  const validGCLIDs = [
    generateTestGCLID(),
    generateSpecialGCLID('underscore-heavy'),
    generateSpecialGCLID('hyphen-heavy'),
    generateSpecialGCLID('numeric'),
    generateSpecialGCLID('mixed'),
  ];

  for (const gclid of validGCLIDs) {
    const result = await testGCLIDValidation(gclid);
    results.push({ gclid, result });
    if (result.valid) passed++;
    else failed++;
  }

  // Test invalid GCLIDs
  for (const gclid of INVALID_GCLIDS) {
    const result = await testGCLIDValidation(gclid);
    results.push({ gclid, result });
    if (!result.valid) passed++;
    else failed++;
  }

  return { passed, failed, results };
}

/**
 * Simulate lead processing with GCLID
 */
export async function simulateLeadProcessing(lead: TestLead): Promise<{
  success: boolean;
  gclidCaptured: boolean;
  gclidValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let gclidValid = false;

  // Validate email
  if (!lead.email || !lead.email.includes('@')) {
    errors.push('Invalid email');
  }

  // Validate GCLID
  if (lead.gclid) {
    const result = await testGCLIDValidation(lead.gclid);
    gclidValid = result.valid;
    if (!gclidValid) {
      errors.push(`Invalid GCLID: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    gclidCaptured: !!lead.gclid,
    gclidValid,
    errors,
  };
}

/**
 * Batch simulation for load testing
 */
export async function simulateBatchProcessing(
  leads: TestLead[],
  options: { parallel?: boolean; batchSize?: number } = {}
): Promise<{
  total: number;
  success: number;
  failed: number;
  gclidStats: { total: number; valid: number; invalid: number };
}> {
  const { parallel = true } = options;

  let total = 0;
  let success = 0;
  const gclidStats = { total: 0, valid: 0, invalid: 0 };

  const processLead = async (lead: TestLead) => {
    const result = await simulateLeadProcessing(lead);
    total++;

    if (result.success) success++;
    if (lead.gclid) {
      gclidStats.total++;
      if (result.gclidValid) gclidStats.valid++;
      else gclidStats.invalid++;
    }
  };

  if (parallel) {
    await Promise.all(leads.map(processLead));
  } else {
    for (const lead of leads) {
      await processLead(lead);
    }
  }

  return {
    total,
    success,
    failed: total - success,
    gclidStats,
  };
}

// Export test data generators
export const TEST_DATA = {
  // Valid GCLIDs
  VALID_GCLIDS: [
    'GCLID_EAIaIQv3i3m8e7vOZ-1572532743',
    'GCLID_abc_def_ghi_jkl_mno_pqr_stu_vwx_yz',
    'GCLID_123456789012345678901234567890',
    'GCLID_ABC-DEF_GHI-JKL_MNO-PQR',
  ],

  // Invalid GCLIDs
  INVALID_GCLIDS: [
    null,
    undefined,
    '',
    'invalid',
    'gclid_short',
    'GCLID_short',
    'GCLID_' + 'a'.repeat(50),
    '123456789012345678901234',
  ],

  // Test leads
  SAMPLE_LEADS: [
    createTestLead({ gclid: 'GCLID_EAIaIQv3i3m8e7vOZ-1572532743' }),
    createTestLead({ gclid: null }), // No GCLID
    createTestLead({ gclid: 'INVALID' }), // Invalid GCLID
  ],
};
