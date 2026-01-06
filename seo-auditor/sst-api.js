export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      switch (path) {
        case '/api/v1/sst/auth':
          return await handleAuthentication(request, env);
        case '/api/v1/sst/events':
          return await handleEvents(request, env);
        case '/api/v1/sst/sites':
          return await handleSiteManagement(request, env);
        default:
          return new Response('Endpoint not found', { status: 404 });
      }
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleAuthentication(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { siteId, domain, url, userAgent, timestamp } = await request.json();
  
  if (!siteId) {
    return jsonResponse({ success: false, error: 'Site ID required' }, 400);
  }

  try {
    const site = await env.DB.prepare(
      'SELECT * FROM sites WHERE site_id = ? AND status = "active"'
    ).bind(siteId).first();

    if (!site) {
      return jsonResponse({ 
        success: false, 
        error: 'Site not found or inactive',
        code: 'SITE_NOT_FOUND'
      }, 404);
    }

    if (site.domain !== domain) {
      return jsonResponse({ 
        success: false, 
        error: 'Domain mismatch',
        code: 'DOMAIN_MISMATCH'
      }, 403);
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await env.DB.prepare(`
      INSERT INTO sessions (session_id, site_id, expires_at, created_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      siteId,
      expiresAt.toISOString(),
      new Date().toISOString(),
      userAgent,
      request.headers.get('CF-Connecting-IP') || 'unknown'
    ).run();

    await env.DB.prepare(
      'UPDATE sites SET last_activity = ? WHERE site_id = ?'
    ).bind(new Date().toISOString(), siteId).run();

    return jsonResponse({
      success: true,
      authenticated: true,
      sessionId: sessionId,
      site: {
        id: siteId,
        domain: site.domain,
        name: site.name,
        plan: site.plan
      }
    });

  } catch (error) {
    return jsonResponse({ 
      success: false, 
      error: 'Authentication failed',
      details: error.message 
    }, 500);
  }
}

async function handleEvents(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authorization required' }, 401);
  }

  const sessionId = authHeader.substring(7);
  
  const session = await env.DB.prepare(
    'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?'
  ).bind(sessionId, new Date().toISOString()).first();

  if (!session) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401);
  }

  const { siteId, events } = await request.json();
  
  const siteCheck = await env.DB.prepare(
    'SELECT site_id FROM sessions WHERE session_id = ? AND site_id = ?'
  ).bind(sessionId, siteId).first();

  if (!siteCheck) {
    return jsonResponse({ error: 'Session/site mismatch' }, 403);
  }

  try {
    const eventsToStore = events.map(event => ({
      session_id: sessionId,
      site_id: siteId,
      event_name: event.eventName,
      properties: JSON.stringify(event.properties),
      timestamp: event.timestamp,
      url: event.url,
      user_id: event.userId || null,
      page_view_id: event.pageViewId || null,
      created_at: new Date().toISOString()
    }));

    const stmt = env.DB.prepare(`
      INSERT INTO events (
        session_id, site_id, event_name, properties, timestamp, 
        url, user_id, page_view_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const event of eventsToStore) {
      await stmt.bind(
        event.session_id,
        event.site_id,
        event.event_name,
        event.properties,
        event.timestamp,
        event.url,
        event.user_id,
        event.page_view_id,
        event.created_at
      ).run();
    }

    await env.DB.prepare(
      'UPDATE sites SET last_activity = ? WHERE site_id = ?'
    ).bind(new Date().toISOString(), siteId).run();

    return jsonResponse({
      success: true,
      processed: events.length,
      sessionId: sessionId
    });

  } catch (error) {
    return jsonResponse({ 
      error: 'Event processing failed',
      details: error.message 
    }, 500);
  }
}

async function handleSiteManagement(request, env) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    return jsonResponse({ error: 'API key required' }, 401);
  }

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE api_key = ? AND status = "active"'
  ).bind(apiKey).first();

  if (!user) {
    return jsonResponse({ error: 'Invalid API key' }, 401);
  }

  if (request.method === 'GET') {
    const sites = await env.DB.prepare(
      'SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();

    return jsonResponse({
      success: true,
      sites: sites.map(site => ({
        id: site.site_id,
        domain: site.domain,
        name: site.name,
        status: site.status,
        plan: site.plan,
        created_at: site.created_at,
        last_activity: site.last_activity,
        event_count: site.event_count || 0
      }))
    });
  }

  if (request.method === 'POST') {
    const { domain, name, plan = 'starter' } = await request.json();

    if (!domain || !name) {
      return jsonResponse({ error: 'Domain and name required' }, 400);
    }

    const siteId = crypto.randomUUID();
    
    await env.DB.prepare(`
      INSERT INTO sites (site_id, user_id, domain, name, plan, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).bind(siteId, user.id, domain, name, plan, new Date().toISOString()).run();

    return jsonResponse({
      success: true,
      siteId: siteId,
      message: 'Site registered successfully'
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version'
    }
  });
}