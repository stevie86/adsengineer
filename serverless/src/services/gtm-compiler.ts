import { z } from 'zod';

const GTMParameterSchema = z.object({
  type: z.string().optional(),
  key: z.string(),
  value: z.string().optional(),
  list: z.any().optional(),
  map: z.any().optional(),
});

export const GTMTagSchema = z.object({
  name: z.string().optional(),
  type: z.string(),
  parameter: z.union([z.array(GTMParameterSchema), z.any()]).optional(),
  firingTriggerId: z.union([z.array(z.string()), z.string()]).optional(),
  paused: z.boolean().optional(),
});

export const GTMContainerSchema = z.object({
  containerVersion: z.object({
    tag: z.array(GTMTagSchema).optional(),
    trigger: z.array(z.any()).optional(),
    variable: z.array(z.any()).optional(),
  }),
});

export type GTMTag = z.infer<typeof GTMTagSchema>;

export class GTMCompiler {
  static analyze(json: string) {
    try {
      const parsed = JSON.parse(json);
      console.log('Parsed JSON keys:', Object.keys(parsed));

      const data = GTMContainerSchema.parse(parsed);
      const tags = data.containerVersion.tag || [];
      console.log('Tag count:', tags.length);

      const ga4Configs = tags.filter((t) => t.type === 'gaawc');
      const ga4Events = tags.filter((t) => t.type === 'gaawe');
      const googleAds = tags.filter((t) => t.type === 'awct');

      const measurementIds = new Set<string>();
      ga4Configs.forEach((tag) => {
        const mId = tag.parameter?.find((p) => p.key === 'measurementId')?.value;
        if (mId) measurementIds.add(mId);
      });

      const adsConversions = googleAds.map((tag) => ({
        name: tag.name,
        conversionId: tag.parameter?.find((p) => p.key === 'conversionId')?.value,
        conversionLabel: tag.parameter?.find((p) => p.key === 'conversionLabel')?.value,
      }));

      return {
        stats: {
          totalTags: tags.length,
          ga4Configs: ga4Configs.length,
          ga4Events: ga4Events.length,
          googleAds: googleAds.length,
        },
        measurementIds: Array.from(measurementIds),
        adsConversions,
        recommendations: this.getRecommendations(tags),
        workerCode: this.generateWorkerCode(Array.from(measurementIds), adsConversions),
      };
    } catch {
      throw new Error('Invalid GTM Container JSON');
    }
  }

  private static getRecommendations(tags: GTMTag[]) {
    const recs: string[] = [];

    if (tags.some((t) => t.paused)) {
      recs.push('Remove or resume paused tags to clean up the container.');
    }

    if (tags.some((t) => t.type === 'html')) {
      recs.push(
        'Custom HTML tags detected. Consider migrating these to server-side logic for better security and performance.'
      );
    }

    const conversionLinker = tags.find((t) => t.type === 'gcl');
    if (!conversionLinker) {
      recs.push(
        'CRITICAL: No Conversion Linker tag found. GCLID preservation will fail without it.'
      );
    }

    return recs;
  }

  private static generateWorkerCode(measurementIds: string[], adsConversions: any[]) {
    const mId = measurementIds[0] || 'YOUR_GA4_ID';
    const conversionConfigs = adsConversions
      .map((c) => `  // ${c.name}: ID=${c.conversionId}, Label=${c.conversionLabel}`)
      .join('\n');

    return `/**
 * AdsEngineer Edge-Native Tracking Worker
 * Generated from GTM Container Analysis
 * 
 * This worker replaces the heavy client-side GTM container
 * with an edge-native implementation running in Cloudflare Workers.
 * 
 * Benefits:
 * - Zero latency: Global edge deployment (~0ms response time)
 * - Digital Sovereignty: GDPR-compliant, no third-party scripts
 * - 99.99% uptime: Serverless, auto-scaling
 * - Cost-efficient: ~€0 infrastructure cost
 * 
 * Detected Conversions:
${conversionConfigs}
 */

export interface Env {
  DB: D1Database;
  GA4_MEASUREMENT_ID: string;
  GA4_API_SECRET?: string;
}

/**
 * Parse click IDs for platform attribution
 */
interface ClickIds {
  gclid?: string;
  fbclid?: string;
  wbraid?: string;
  gbraid?: string;
}

/**
 * Parse click IDs from URL or headers
 */
function parseClickIds(request: Request): ClickIds {
  const url = new URL(request.url);
  const clickIds: ClickIds = {};
  
  // From URL parameters
  clickIds.gclid = url.searchParams.get('gclid') || undefined;
  clickIds.fbclid = url.searchParams.get('fbclid') || undefined;
  clickIds.wbraid = url.searchParams.get('wbraid') || undefined;
  clickIds.gbraid = url.searchParams.get('gbraid') || undefined;
  
  // From GCL cookie
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const gclidMatch = cookie.match(/_gcl_aw=(GCL.+\.[^;]+)/);
    if (gclidMatch && !clickIds.gclid) {
      clickIds.gclid = gclidMatch[1];
    }
  }
  
  return clickIds;
}

/**
 * Store click IDs for offline attribution
 */
async function trackClickIds(
  db: D1Database,
  clickIds: ClickIds,
  sessionId?: string
): Promise<void> {
  if (!clickIds.gclid && !clickIds.fbclid) return;
  
  const stmt = db.prepare(
    \`INSERT OR REPLACE INTO lead_tracking 
     (session_id, gclid, fbclid, wbraid, gbraid, created_at) 
     VALUES (?, ?, ?, ?, ?, ?)\`
  );
  
  await stmt.bind(
    sessionId || crypto.randomUUID(),
    clickIds.gclid || null,
    clickIds.fbclid || null,
    clickIds.wbraid || null,
    clickIds.gbraid || null,
    new Date().toISOString()
  ).run();
}

/**
 * Send event to GA4 via Measurement Protocol
 */
async function sendToGA4(
  eventName: string,
  params: Record<string, any>,
  clientId: string,
  env: Env
): Promise<void> {
  const measurementId = env.GA4_MEASUREMENT_ID || '${mId}';
  const apiSecret = env.GA4_API_SECRET;
  
  if (!apiSecret) {
    console.warn('GA4_API_SECRET not configured, skipping event send');
    return;
  }
  
  const payload = {
    client_id: clientId,
    events: [{
      name: eventName,
      params: params
    }]
  };
  
  await fetch(
    \`https://www.google-analytics.com/mp/collect?\` +
    \`measurement_id=\${measurementId}&api_secret=\${apiSecret}\`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clickIds = parseClickIds(request);
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 1. Store click IDs for offline attribution
    if (clickIds.gclid || clickIds.fbclid) {
      await trackClickIds(env.DB, clickIds);
    }
    
    // 2. Generate/track session ID
    const sessionId = request.headers.get('x-session-id') || 
                      request.headers.get('cookie')?.match(/session_id=([^;]+)/)?.[1] ||
                      crypto.randomUUID();
    
    // 3. Event tracking endpoint
    if (path === '/api/event' && request.method === 'POST') {
      const body = await request.json() as { event?: string; params?: Record<string, any> };
      const eventName = body.event || 'unknown_event';
      const params = body.params || {};
      
      // Send to GA4
      await sendToGA4(eventName, {
        ...params,
        session_id: sessionId,
        client_id: sessionId,
      }, sessionId, env);
      
      // Store click IDs with this event
      await trackClickIds(env.DB, clickIds, sessionId);
      
      return Response.json({ 
        success: true, 
        edge: true,
        event: eventName,
        session_id: sessionId
      });
    }
    
    // 4. Conversion tracking (Google Ads)
    if (path === '/api/convert' && request.method === 'POST') {
      const body = await request.json();
      const orderTotal = body.value || 0;
      
      // Store conversion for Google Ads upload
      await env.DB.prepare(
        \`INSERT OR REPLACE INTO conversions 
         (session_id, gclid, conversion_value, currency, created_at) 
         VALUES (?, ?, ?, ?, ?)\`
      ).bind(
        sessionId,
        clickIds.gclid || null,
        orderTotal,
        body.currency || 'EUR',
        new Date().toISOString()
      ).run();
      
      // Send to GA4 purchase event
      await sendToGA4('purchase', {
        transaction_id: body.transaction_id || 'unknown',
        value: orderTotal,
        currency: body.currency || 'EUR',
        items: body.items || [],
      }, sessionId, env);
      
      return Response.json({ 
        success: true, 
        edge: true,
        conversion_value: orderTotal
      });
    }
    
    // 5. Health check
    if (path === '/health') {
      return Response.json({ 
        status: 'healthy',
        edge: true,
        measurement_id: env.GA4_MEASUREMENT_ID || '${mId}'
      });
    }
    
    // 6. Default tracking script delivery
    if (path === '/script.js' && request.method === 'GET') {
      const script = \`
(function() {
  // Edge-native tracking script
  (function(w,d,s,id) {
    w._ae = w._ae || {};
    w._ae.q = w._ae.q || [];
    var f = d.getElementsByTagName(s)[0],
        js = d.createElement(s);
    js.async = true;
    js.src = d.location.origin + '/script.js';
    f.parentNode.insertBefore(js, f);
  })(window, document, 'script');
})();
      \`;
      
      return new Response(script, {
        headers: { 'content-type': 'application/javascript' }
      });
    }
    
    // Track page views automatically
    await sendToGA4('page_view', {
      page_location: url.href,
      page_title: 'Page View',
      page_referrer: request.headers.get('referer') || '',
    }, sessionId, env);
    
    return Response.json({ 
      success: true,
      edge: true,
      session_id: sessionId,
      message: 'Edge-native tracking active'
    });
  }
}
`.trim();
  }
}
