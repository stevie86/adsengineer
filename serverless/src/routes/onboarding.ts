import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { gclidSnippet, gclidSnippetReadable } from '../snippet';

export const onboardingRoutes = new Hono<AppEnv>();

const AGREEMENT_VERSIONS = {
  tos: '1.0',
  dpa: '1.0',
  privacy: '1.0'
};

const AGREEMENT_TEXTS = {
  tos: `Terms of Service v${AGREEMENT_VERSIONS.tos}: By using AdsEngineer services, you agree to allow collection and processing of advertising click identifiers (GCLID, FBCLID, MSCLKID) and UTM parameters for the purpose of conversion tracking optimization.`,
  dpa: `Data Processing Agreement v${AGREEMENT_VERSIONS.dpa}: You authorize AdsEngineer to process lead data including email, phone, and advertising identifiers on your behalf for the purpose of offline conversion tracking and Google Ads optimization.`,
  privacy: `Privacy Policy Acknowledgment v${AGREEMENT_VERSIONS.privacy}: You confirm you have a privacy policy that discloses the use of conversion tracking and have obtained necessary consents from your end users.`
};

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

onboardingRoutes.get('/snippet', (c) => {
  const format = c.req.query('format') || 'minified';
  const snippet = format === 'readable' ? gclidSnippetReadable : gclidSnippet;
  
  return c.text(snippet.trim(), 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600'
  });
});

onboardingRoutes.get('/snippet.js', (c) => {
  const jsOnly = gclidSnippet
    .replace('<script>', '')
    .replace('</script>', '')
    .trim();
  
  return c.text(jsOnly, 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=3600'
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
      return c.json({ 
        error: 'All agreements must be accepted',
        required: ['accept_tos', 'accept_dpa', 'accept_privacy']
      }, 400);
    }

    const existing = await db.prepare(
      'SELECT id FROM customers WHERE email = ?'
    ).bind(body.email.toLowerCase()).first();

    if (existing) {
      return c.json({ 
        error: 'Email already registered',
        message: 'Please login or use a different email'
      }, 409);
    }

    const customerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await db.prepare(`
      INSERT INTO customers (id, email, company_name, website, ghl_location_id, plan, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'free', 'active', ?)
    `).bind(
      customerId,
      body.email.toLowerCase(),
      body.company_name || null,
      body.website || null,
      body.ghl_location_id || null,
      now
    ).run();

    const agreements = [
      { type: 'tos', accepted: body.accept_tos },
      { type: 'dpa', accepted: body.accept_dpa },
      { type: 'privacy', accepted: body.accept_privacy }
    ];

    for (const agreement of agreements) {
      if (agreement.accepted) {
        const agreementText = AGREEMENT_TEXTS[agreement.type as keyof typeof AGREEMENT_TEXTS];
        const textHash = await hashText(agreementText);
        
        await db.prepare(`
          INSERT INTO agreements (id, customer_id, agreement_type, agreement_version, accepted_at, ip_address, user_agent, consent_text_hash, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          customerId,
          agreement.type,
          AGREEMENT_VERSIONS[agreement.type as keyof typeof AGREEMENT_VERSIONS],
          now,
          ip,
          userAgent,
          textHash,
          JSON.stringify({ full_text: agreementText })
        ).run();
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
        docs_url: '/docs'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ 
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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
        required: true
      },
      dpa: {
        version: AGREEMENT_VERSIONS.dpa,
        title: 'Data Processing Agreement',
        summary: 'Authorizes processing of lead and tracking data',
        text: AGREEMENT_TEXTS.dpa,
        required: true
      },
      privacy: {
        version: AGREEMENT_VERSIONS.privacy,
        title: 'Privacy Policy Acknowledgment',
        summary: 'Confirms your compliance with privacy requirements',
        text: AGREEMENT_TEXTS.privacy,
        required: true
      }
    }
  });
});

onboardingRoutes.get('/agreements/:customerId', async (c) => {
  const db = c.env.DB;
  const customerId = c.req.param('customerId');

  try {
    const agreements = await db.prepare(`
      SELECT 
        agreement_type,
        agreement_version,
        accepted_at,
        ip_address,
        consent_text_hash
      FROM agreements 
      WHERE customer_id = ?
      ORDER BY accepted_at DESC
    `).bind(customerId).all();

    if (agreements.results.length === 0) {
      return c.json({ error: 'No agreements found for this customer' }, 404);
    }

    return c.json({
      customer_id: customerId,
      agreements: agreements.results,
      message: 'Audit trail of all accepted agreements'
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

    const customer = await db.prepare(
      'SELECT id FROM customers WHERE id = ?'
    ).bind(customerId).first();

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const agreementText = AGREEMENT_TEXTS[body.agreement_type];
    const textHash = await hashText(agreementText);
    const now = new Date().toISOString();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    await db.prepare(`
      INSERT INTO agreements (id, customer_id, agreement_type, agreement_version, accepted_at, ip_address, user_agent, consent_text_hash, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      customerId,
      body.agreement_type,
      AGREEMENT_VERSIONS[body.agreement_type],
      now,
      ip,
      userAgent,
      textHash,
      JSON.stringify({ full_text: agreementText })
    ).run();

    return c.json({
      success: true,
      message: `${body.agreement_type.toUpperCase()} agreement accepted`,
      accepted_at: now,
      version: AGREEMENT_VERSIONS[body.agreement_type]
    });

  } catch (error) {
    console.error('Accept agreement error:', error);
    return c.json({ error: 'Failed to record agreement' }, 500);
  }
});
