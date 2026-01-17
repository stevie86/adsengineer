import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { gclidSnippet, gclidSnippetReadable } from '../snippet';

export const onboardingRoutes = new Hono<AppEnv>();

const AGREEMENT_VERSIONS = {
  tos: '1.0',
  dpa: '1.0',
  privacy: '1.0',
};

const AGREEMENT_TEXTS = {
  tos: `Terms of Service v${AGREEMENT_VERSIONS.tos}: By using AdsEngineer services, you agree to allow collection and processing of advertising click identifiers (GCLID, FBCLID, MSCLKID) and UTM parameters for the purpose of conversion tracking optimization.`,
  dpa: `Data Processing Agreement v${AGREEMENT_VERSIONS.dpa}: You authorize AdsEngineer to process lead data including email, phone, and advertising identifiers on your behalf for the purpose of offline conversion tracking and Google Ads optimization.`,
  privacy: `Privacy Policy Acknowledgment v${AGREEMENT_VERSIONS.privacy}: You confirm you have a privacy policy that discloses the use of conversion tracking and have obtained necessary consents from your end users.`,
};

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

onboardingRoutes.get('/snippet', (c) => {
  const format = c.req.query('format') || 'minified';
  const snippet = format === 'readable' ? gclidSnippetReadable : gclidSnippet;

  return c.text(snippet.trim(), 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

onboardingRoutes.get('/snippet.js', (c) => {
  const jsOnly = gclidSnippet.replace('<script>', '').replace('</script>', '').trim();

  return c.text(jsOnly, 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
});

onboardingRoutes.post('/register', async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json<{
      email: string;
      company_name?: string;
      website?: string;
      ghl_location_id?: string;
      accept_tos: boolean;
      accept_dpa: boolean;
      accept_privacy: boolean;
    }>();

    if (!body.email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    if (!body.accept_tos || !body.accept_dpa || !body.accept_privacy) {
      return c.json(
        {
          error: 'All agreements must be accepted',
          required: ['accept_tos', 'accept_dpa', 'accept_privacy'],
        },
        400
      );
    }

    const existing = await db
      .prepare('SELECT id FROM customers WHERE email = ?')
      .bind(body.email.toLowerCase())
      .first();

    if (existing) {
      return c.json(
        {
          error: 'Email already registered',
          message: 'Please login or use a different email',
        },
        409
      );
    }

    const customerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await db
      .prepare(`
      INSERT INTO customers (id, email, company_name, website, ghl_location_id, plan, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'free', 'active', ?)
    `)
      .bind(
        customerId,
        body.email.toLowerCase(),
        body.company_name || null,
        body.website || null,
        body.ghl_location_id || null,
        now
      )
      .run();

    const agreements = [
      { type: 'tos', accepted: body.accept_tos },
      { type: 'dpa', accepted: body.accept_dpa },
      { type: 'privacy', accepted: body.accept_privacy },
    ];

    for (const agreement of agreements) {
      if (agreement.accepted) {
        const agreementText = AGREEMENT_TEXTS[agreement.type as keyof typeof AGREEMENT_TEXTS];
        const textHash = await hashText(agreementText);

        await db
          .prepare(`
          INSERT INTO agreements (id, customer_id, agreement_type, agreement_version, accepted_at, ip_address, user_agent, consent_text_hash, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            crypto.randomUUID(),
            customerId,
            agreement.type,
            AGREEMENT_VERSIONS[agreement.type as keyof typeof AGREEMENT_VERSIONS],
            now,
            ip,
            userAgent,
            textHash,
            JSON.stringify({ full_text: agreementText })
          )
          .run();
      }
    }

    return c.json({
      success: true,
      customer_id: customerId,
      message: 'Registration successful. Agreements recorded.',
      agreements_accepted: ['tos', 'dpa', 'privacy'],
      next_steps: {
        snippet_url: '/api/v1/onboarding/snippet',
        webhook_url: '/api/v1/ghl/webhook',
        docs_url: '/docs',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json(
      {
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

onboardingRoutes.get('/agreements', async (c) => {
  return c.json({
    current_versions: AGREEMENT_VERSIONS,
    agreements: {
      tos: {
        version: AGREEMENT_VERSIONS.tos,
        title: 'Terms of Service',
        summary: 'Governs your use of AdsEngineer services',
        text: AGREEMENT_TEXTS.tos,
        required: true,
      },
      dpa: {
        version: AGREEMENT_VERSIONS.dpa,
        title: 'Data Processing Agreement',
        summary: 'Authorizes processing of lead and tracking data',
        text: AGREEMENT_TEXTS.dpa,
        required: true,
      },
      privacy: {
        version: AGREEMENT_VERSIONS.privacy,
        title: 'Privacy Policy Acknowledgment',
        summary: 'Confirms your compliance with privacy requirements',
        text: AGREEMENT_TEXTS.privacy,
        required: true,
      },
    },
  });
});

onboardingRoutes.get('/agreements/:customerId', async (c) => {
  const db = c.env.DB;
  const customerId = c.req.param('customerId');

  try {
    const agreements = await db
      .prepare(`
      SELECT 
        agreement_type,
        agreement_version,
        accepted_at,
        ip_address,
        consent_text_hash
      FROM agreements 
      WHERE customer_id = ?
      ORDER BY accepted_at DESC
    `)
      .bind(customerId)
      .all();

    if (agreements.results.length === 0) {
      return c.json({ error: 'No agreements found for this customer' }, 404);
    }

    return c.json({
      customer_id: customerId,
      agreements: agreements.results,
      message: 'Audit trail of all accepted agreements',
    });
  } catch (error) {
    console.error('Fetch agreements error:', error);
    return c.json({ error: 'Failed to fetch agreements' }, 500);
  }
});

onboardingRoutes.post('/agreements/:customerId/accept', async (c) => {
  const db = c.env.DB;
  const customerId = c.req.param('customerId');

  try {
    const body = await c.req.json<{
      agreement_type: 'tos' | 'dpa' | 'privacy';
    }>();

    if (!body.agreement_type || !AGREEMENT_TEXTS[body.agreement_type]) {
      return c.json({ error: 'Invalid agreement type' }, 400);
    }

    const customer = await db
      .prepare('SELECT id FROM customers WHERE id = ?')
      .bind(customerId)
      .first();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const agreementText = AGREEMENT_TEXTS[body.agreement_type];
    const textHash = await hashText(agreementText);
    const now = new Date().toISOString();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await db
      .prepare(`
      INSERT INTO agreements (id, customer_id, agreement_type, agreement_version, accepted_at, ip_address, user_agent, consent_text_hash, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        crypto.randomUUID(),
        customerId,
        body.agreement_type,
        AGREEMENT_VERSIONS[body.agreement_type],
        now,
        ip,
        userAgent,
        textHash,
        JSON.stringify({ full_text: agreementText })
      )
      .run();

    return c.json({
      success: true,
      message: `${body.agreement_type.toUpperCase()} agreement accepted`,
      accepted_at: now,
      version: AGREEMENT_VERSIONS[body.agreement_type],
    });
  } catch (error) {
    console.error('Accept agreement error:', error);
    return c.json({ error: 'Failed to record agreement' }, 500);
  }
});

onboardingRoutes.post('/site-setup', async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json<{
      customer_id: string;
      website: string;
      sgtm_container_url?: string;
      measurement_id?: string;
      api_secret?: string;
      client_tier?: 'internal' | 'tier1' | 'tier2';
    }>();

    if (!body.customer_id || !body.website) {
      return c.json({ error: 'customer_id and website are required' }, 400);
    }

    const customer = await db
      .prepare('SELECT id, email, company_name FROM customers WHERE id = ?')
      .bind(body.customer_id)
      .first<{ id: string; email: string; company_name: string | null }>();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const sgtmConfig = body.sgtm_container_url && body.measurement_id
      ? JSON.stringify({
          container_url: body.sgtm_container_url,
          measurement_id: body.measurement_id,
          api_secret: body.api_secret || null,
        })
      : null;

    await db
      .prepare(`
        UPDATE customers 
        SET website = ?, sgtm_config = ?, client_tier = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        body.website,
        sgtmConfig,
        body.client_tier || 'tier2',
        new Date().toISOString(),
        body.customer_id
      )
      .run();

    const apiBaseUrl = c.env.ENVIRONMENT === 'production'
      ? 'https://api.adsengineer.cloud'
      : 'https://adsengineer-cloud-staging.adsengineer.workers.dev';

    const snippetUrl = `${apiBaseUrl}/api/v1/onboarding/snippet.js`;
    const webhookUrl = `${apiBaseUrl}/api/v1/shopify/webhook`;

    const response: Record<string, unknown> = {
      success: true,
      customer_id: body.customer_id,
      website: body.website,
      tracking_snippet: {
        script_tag: `<script src="${snippetUrl}" async></script>`,
        inline_snippet: gclidSnippet,
        installation: 'Add the script tag to your website <head> or before </body>',
      },
      webhook_endpoints: {
        shopify: webhookUrl,
        woocommerce: `${apiBaseUrl}/api/v1/woocommerce/webhook`,
        generic: `${apiBaseUrl}/api/v1/events`,
      },
      test_urls: {
        health: `${apiBaseUrl}/health`,
        snippet: `${apiBaseUrl}/api/v1/onboarding/snippet`,
      },
    };

    if (sgtmConfig) {
      response.sgtm_setup = {
        status: 'configured',
        container_url: body.sgtm_container_url,
        measurement_id: body.measurement_id,
        instructions: [
          '1. Deploy your sGTM container to Cloud Run or App Engine',
          '2. Add a Measurement Protocol Client to receive server-to-server events',
          '3. Configure triggers for: purchase, add_to_cart, begin_checkout, generate_lead',
          '4. Add tags for each platform: GA4, Google Ads, Meta CAPI, TikTok Events API',
          '5. Test using sGTM Preview mode before going live',
        ],
      };
    } else {
      response.sgtm_setup = {
        status: 'not_configured',
        instructions: [
          'To enable server-side tracking via sGTM:',
          '1. Create a Server container in Google Tag Manager',
          '2. Deploy to Cloud Run (recommended) - costs ~$45/month',
          '3. Get your container URL (e.g., https://gtm.yourdomain.com)',
          '4. Create a GA4 property and get your Measurement ID (G-XXXXXXX)',
          '5. Call this endpoint again with sgtm_container_url and measurement_id',
        ],
        docs_url: 'https://developers.google.com/tag-platform/tag-manager/server-side',
      };
    }

    response.ga4_setup = {
      measurement_protocol: {
        endpoint: body.sgtm_container_url
          ? `${body.sgtm_container_url}/g/collect`
          : 'https://www.google-analytics.com/g/collect',
        required_params: {
          v: '2 (protocol version)',
          tid: 'G-XXXXXXX (your Measurement ID)',
          cid: 'client_id (unique visitor identifier)',
          en: 'event_name (purchase, add_to_cart, etc.)',
        },
        example_purchase: `POST ${body.sgtm_container_url || 'https://gtm.yourdomain.com'}/g/collect
Content-Type: application/x-www-form-urlencoded

v=2&tid=${body.measurement_id || 'G-XXXXXXX'}&cid=123.456&en=purchase&ep.transaction_id=ORD-123&epn.value=99.99&ep.currency=USD`,
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Site setup error:', error);
    return c.json(
      {
        error: 'Site setup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

onboardingRoutes.get('/site-setup/:customerId', async (c) => {
  const db = c.env.DB;
  const customerId = c.req.param('customerId');

  try {
    const customer = await db
      .prepare('SELECT id, email, company_name, website, sgtm_config, client_tier FROM customers WHERE id = ?')
      .bind(customerId)
      .first<{
        id: string;
        email: string;
        company_name: string | null;
        website: string | null;
        sgtm_config: string | null;
        client_tier: string | null;
      }>();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const sgtmConfig = customer.sgtm_config ? JSON.parse(customer.sgtm_config) : null;

    return c.json({
      customer_id: customer.id,
      email: customer.email,
      company_name: customer.company_name,
      website: customer.website,
      client_tier: customer.client_tier || 'tier2',
      sgtm_configured: !!sgtmConfig,
      sgtm_config: sgtmConfig
        ? {
            container_url: sgtmConfig.container_url,
            measurement_id: sgtmConfig.measurement_id,
            has_api_secret: !!sgtmConfig.api_secret,
          }
        : null,
    });
  } catch (error) {
    console.error('Get site setup error:', error);
    return c.json({ error: 'Failed to get site setup' }, 500);
  }
});
