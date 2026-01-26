import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import type { AppEnv } from './types';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AdsEngineer API',
    version: '1.0.0',
    description: 'Conversion tracking API for GoHighLevel agencies',
    contact: {
      name: 'AdsEngineer Support',
      url: 'https://adsengineer.com',
    },
  },
  servers: [
    {
      url: 'https://adsengineer-cloud.adsengineer.workers.dev',
      description: 'Production',
    },
    {
      url: 'http://localhost:8787',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'GHL', description: 'GoHighLevel webhook integration' },
    { name: 'Shopify', description: 'Shopify webhook integration' },
    { name: 'Waitlist', description: 'Landing page waitlist signups' },
    { name: 'Leads', description: 'Lead management (JWT authenticated)' },
    { name: 'Custom Events', description: 'Custom event tracking (JWT authenticated)' },
    { name: 'Admin', description: 'Admin operations (admin token required)' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns API health status and version',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                    environment: { type: 'string', example: 'production' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/ghl/webhook': {
      get: {
        tags: ['GHL'],
        summary: 'Webhook info',
        description: 'Returns webhook usage information',
        responses: {
          '200': {
            description: 'Webhook info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    usage: { type: 'string' },
                    required_fields: { type: 'array', items: { type: 'string' } },
                    optional_fields: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['GHL'],
        summary: 'Receive GHL webhook',
        description:
          'Receives lead data from GoHighLevel workflows. Captures GCLID/FBCLID for offline conversion tracking.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  contact_id: { type: 'string', description: 'GHL contact ID' },
                  location_id: { type: 'string', description: 'GHL location/sub-account ID' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  gclid: { type: 'string', description: 'Google Click ID' },
                  fbclid: { type: 'string', description: 'Facebook Click ID' },
                  utm_source: { type: 'string' },
                  utm_medium: { type: 'string' },
                  utm_campaign: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  custom_fields: { type: 'object' },
                },
              },
              example: {
                email: 'lead@example.com',
                phone: '+1234567890',
                gclid: 'CjwKCAtest123',
                utm_source: 'google',
                utm_medium: 'cpc',
                tags: ['qualified', 'high-value'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Lead captured successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    lead_id: { type: 'string' },
                    gclid_captured: { type: 'boolean' },
                    fbclid_captured: { type: 'boolean' },
                    lead_value_cents: { type: 'integer' },
                    conversion_ready: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing required fields',
          },
          '500': {
            description: 'Processing error',
          },
        },
      },
    },
    '/api/v1/shopify/webhook': {
      get: {
        tags: ['Shopify'],
        summary: 'Shopify webhook info',
        description: 'Returns Shopify webhook usage information and supported topics',
        responses: {
          '200': {
            description: 'Webhook info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    supported_topics: { type: 'array', items: { type: 'string' } },
                    usage: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Shopify'],
        summary: 'Receive Shopify webhook',
        description:
          'Receives customer and order data from Shopify stores. Processes leads for conversion tracking.',
        parameters: [
          {
            name: 'X-Shopify-Topic',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Shopify webhook topic (customers/create, orders/create, etc.)',
          },
          {
            name: 'X-Shopify-Shop-Domain',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'Shopify store domain',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    title: 'Customer Webhook',
                    type: 'object',
                    properties: {
                      id: { type: 'integer', description: 'Customer ID' },
                      email: { type: 'string', format: 'email' },
                      first_name: { type: 'string' },
                      last_name: { type: 'string' },
                      phone: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'May contain UTM parameters',
                      },
                    },
                  },
                  {
                    title: 'Order Webhook',
                    type: 'object',
                    properties: {
                      id: { type: 'integer', description: 'Order ID' },
                      email: { type: 'string', format: 'email' },
                      total_price: { type: 'string', description: 'Order total' },
                      currency: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                      landing_site: { type: 'string', description: 'Referral URL' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'May contain UTM parameters',
                      },
                      customer: {
                        type: 'object',
                        properties: {
                          email: { type: 'string', format: 'email' },
                          first_name: { type: 'string' },
                          phone: { type: 'string' },
                        },
                      },
                    },
                  },
                ],
              },
              example: {
                id: 123456789,
                email: 'customer@mycannaby.de',
                first_name: 'John',
                last_name: 'Doe',
                phone: '+49123456789',
                created_at: '2024-01-15T10:30:00Z',
                tags: ['gclid:CjwKCAtest123', 'utm_source:google', 'utm_campaign:summer_sale'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Lead processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    lead_id: { type: 'string', example: 'abc-123-def' },
                    topic: { type: 'string', example: 'customers/create' },
                    shop_domain: { type: 'string', example: 'mycannaby.de' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid webhook data',
          },
          '404': {
            description: 'Agency not found for shop domain',
          },
          '500': {
            description: 'Processing error',
          },
        },
      },
    },
    '/api/v1/gdpr/data-request/{email}': {
      get: {
        tags: ['GDPR'],
        summary: 'GDPR Data Access Request',
        description: 'Right to Access - View all personal data stored about you (GDPR Article 15)',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
            description: 'Email address to request data for',
          },
        ],
        responses: {
          '200': {
            description: 'Data access provided',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        leads: { type: 'array' },
                        conversion_logs: { type: 'array' },
                        data_portability: { type: 'object' },
                      },
                    },
                    gdpr_rights: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/gdpr/data-export/{email}': {
      get: {
        tags: ['GDPR'],
        summary: 'GDPR Data Export',
        description:
          'Right to Data Portability - Download all your personal data (GDPR Article 20)',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
            description: 'Email address to export data for',
          },
        ],
        responses: {
          '200': {
            description: 'Data export file',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    export_timestamp: { type: 'string' },
                    data_controller: { type: 'string' },
                    leads: { type: 'array' },
                    consent_history: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/gdpr/data-rectify/{email}': {
      put: {
        tags: ['GDPR'],
        summary: 'GDPR Data Rectification',
        description: 'Right to Rectification - Correct inaccurate personal data (GDPR Article 16)',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
            description: 'Email address to rectify data for',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vertical: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Data rectification completed',
          },
        },
      },
    },
    '/api/v1/gdpr/data-erase/{email}': {
      delete: {
        tags: ['GDPR'],
        summary: 'GDPR Right to Erasure',
        description: 'Right to be Forgotten - Delete all personal data (GDPR Article 17)',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
            description: 'Email address to erase data for',
          },
        ],
        responses: {
          '200': {
            description: 'Data erasure completed',
          },
        },
      },
    },
    '/api/v1/gdpr/consent-withdraw/{email}': {
      post: {
        tags: ['GDPR'],
        summary: 'GDPR Consent Withdrawal',
        description: 'Withdraw consent for data processing (GDPR Article 7)',
        parameters: [
          {
            name: 'email',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'email' },
            description: 'Email address to withdraw consent for',
          },
        ],
        responses: {
          '200': {
            description: 'Consent withdrawn successfully',
          },
        },
      },
    },
    '/api/v1/gdpr/privacy-policy': {
      get: {
        tags: ['GDPR'],
        summary: 'Privacy Policy',
        description: 'Complete privacy policy and data processing information (GDPR Article 13/14)',
        responses: {
          '200': {
            description: 'Privacy policy information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data_controller: { type: 'object' },
                    legal_basis: { type: 'string' },
                    data_purposes: { type: 'array' },
                    retention_periods: { type: 'object' },
                    data_subject_rights: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/waitlist': {
      post: {
        tags: ['Waitlist'],
        summary: 'Join waitlist',
        description: 'Submit email to join the product waitlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  agency_name: { type: 'string' },
                  website: { type: 'string', format: 'uri' },
                  monthly_ad_spend: { type: 'string' },
                  pain_point: { type: 'string' },
                  referral_source: { type: 'string' },
                },
              },
              example: {
                email: 'agency@example.com',
                agency_name: 'Growth Marketing Co',
                monthly_ad_spend: '$10k-50k',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Signup successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    id: { type: 'string' },
                    already_registered: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid email',
          },
        },
      },
    },
    '/api/v1/waitlist/count': {
      get: {
        tags: ['Waitlist'],
        summary: 'Get waitlist count',
        description: 'Returns current waitlist signup count',
        responses: {
          '200': {
            description: 'Count retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    waitlist_count: { type: 'integer' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/custom-events': {
      get: {
        tags: ['Custom Events'],
        summary: 'List custom events',
        description: 'Retrieve custom events with pagination and filtering',
        security: [{ jwtAuth: [] }],
        parameters: [
          {
            name: 'site_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by site ID',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
            description: 'Number of results per page',
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 },
            description: 'Number of results to skip',
          },
        ],
        responses: {
          '200': {
            description: 'Custom events retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    events: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          site_id: { type: 'string' },
                          event_name: { type: 'string' },
                          value: { type: 'number' },
                          currency: { type: 'string' },
                          created_at: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        limit: { type: 'integer' },
                        offset: { type: 'integer' },
                        has_more: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized - Invalid JWT token' },
          '500': { description: 'Server error' },
        },
      },
      post: {
        tags: ['Custom Events'],
        summary: 'Create custom event',
        description: 'Track a custom business event for conversion',
        security: [{ jwtAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['site_id', 'event_name', 'value'],
                properties: {
                  site_id: { type: 'string', description: 'Site identifier' },
                  event_name: {
                    type: 'string',
                    description: 'Event name (e.g., subscription_start, high_value_purchase)',
                  },
                  value: { type: 'number', description: 'Event value in cents' },
                  currency: { type: 'string', description: 'Currency code (default: USD)' },
                  customer_email: {
                    type: 'string',
                    format: 'email',
                    description: 'Customer email for PII hashing',
                  },
                  gclid: { type: 'string', description: 'Google Click ID' },
                  fbclid: { type: 'string', description: 'Facebook Click ID' },
                  utm_source: { type: 'string' },
                  utm_medium: { type: 'string' },
                  utm_campaign: { type: 'string' },
                  metadata: { type: 'object', description: 'Additional event data' },
                },
              },
              example: {
                site_id: 'site-123',
                event_name: 'subscription_start',
                value: 9900,
                currency: 'USD',
                customer_email: 'customer@example.com',
                gclid: 'CjwKCAtest123',
                utm_source: 'google',
                utm_medium: 'cpc',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    event_id: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid request data' },
          '401': { description: 'Unauthorized - Invalid JWT token' },
        },
      },
    },
    '/api/v1/admin/backup': {
      get: {
        tags: ['Admin'],
        summary: 'Export encrypted backup',
        description:
          'Exports all database tables as AES-256-GCM encrypted JSON. Use for automated backups to GDrive.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Backup data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    encrypted: { type: 'boolean' },
                    exported_at: { type: 'string', format: 'date-time' },
                    counts: {
                      type: 'object',
                      properties: {
                        leads: { type: 'integer' },
                        waitlist: { type: 'integer' },
                        optimization_triggers: { type: 'integer' },
                      },
                    },
                    data: { type: 'string', description: 'Base64 encoded ciphertext' },
                    iv: { type: 'string', description: 'Base64 encoded IV' },
                  },
                },
              },
            },
          },
          '401': { description: 'Missing authorization' },
          '403': { description: 'Invalid admin token' },
        },
      },
    },
    '/api/v1/admin/backup/decrypt': {
      post: {
        tags: ['Admin'],
        summary: 'Decrypt backup',
        description: 'Decrypts a previously exported backup. Useful for restore verification.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['data', 'iv'],
                properties: {
                  data: { type: 'string', description: 'Base64 encoded ciphertext' },
                  iv: { type: 'string', description: 'Base64 encoded IV' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Decrypted backup data' },
          '400': { description: 'Missing data or iv' },
          '401': { description: 'Missing authorization' },
        },
      },
    },
    '/api/v1/custom-event-definitions/definitions': {
      get: {
        tags: ['Custom Events'],
        summary: 'List event definitions',
        description: 'Retrieve custom event definitions for organization',
        security: [{ jwtAuth: [] }],
        responses: {
          '200': {
            description: 'Definitions retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    definitions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          event_name: { type: 'string' },
                          display_name: { type: 'string' },
                          description: { type: 'string' },
                          trigger_type: {
                            type: 'string',
                            enum: ['webhook', 'frontend', 'api', 'manual'],
                          },
                          is_active: { type: 'boolean' },
                          google_ads_conversion_action: { type: 'string' },
                          google_ads_category: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized - Invalid JWT token' },
        },
      },
      post: {
        tags: ['Custom Events'],
        summary: 'Create event definition',
        description: 'Define a new custom event type with trigger conditions',
        security: [{ jwtAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event_name', 'display_name', 'trigger_type'],
                properties: {
                  event_name: { type: 'string', description: 'Unique event identifier' },
                  display_name: { type: 'string', description: 'Human-readable name' },
                  description: { type: 'string', description: 'Event purpose and behavior' },
                  trigger_type: { type: 'string', enum: ['webhook', 'frontend', 'api', 'manual'] },
                  trigger_conditions: {
                    type: 'object',
                    description: 'Platform-specific conditions',
                  },
                  google_ads_conversion_action: {
                    type: 'string',
                    description: 'Google Ads conversion action name',
                  },
                  google_ads_category: {
                    type: 'string',
                    description: 'Google Ads conversion category',
                  },
                  strategic_value: { type: 'string', description: 'Business value description' },
                  priority: { type: 'integer', description: 'Display and processing priority' },
                },
                example: {
                  event_name: 'subscription_start',
                  display_name: 'Subscription Start',
                  description: 'Track when customer starts subscription',
                  trigger_type: 'webhook',
                  google_ads_conversion_action: 'subscription_start',
                  google_ads_category: 'LEAD',
                  priority: 1,
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Definition created' },
          '400': { description: 'Invalid request data' },
          '401': { description: 'Unauthorized - Invalid JWT token' },
        },
      },
    },
    '/api/v1/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get statistics',
        description: 'Returns lead and waitlist counts with 7-day trend',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totals: {
                      type: 'object',
                      properties: {
                        leads: { type: 'integer' },
                        waitlist: { type: 'integer' },
                      },
                    },
                    leads_last_7_days: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string' },
                          count: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Admin endpoints require ADMIN_SECRET as bearer token',
      },
      jwtAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token with HMAC-SHA256 signature verification for API authentication',
      },
    },
  },
};

export function setupDocs(app: Hono<AppEnv>) {
  app.get('/docs', swaggerUI({ url: '/openapi.json' }));

  app.get('/openapi.json', (c) => {
    return c.json(openApiSpec);
  });
}
