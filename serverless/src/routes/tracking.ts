import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const trackingRoutes = new Hono<AppEnv>();

trackingRoutes.post('/page-visit', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json();

    // Extract and provide defaults for all fields
    const sessionId = body.sessionId || null;
    const userId = body.userId || null;
    const pageUrl = body.pageUrl || '';
    const pageTitle = body.pageTitle || '';
    const referrer = body.referrer || '';
    const userAgent = body.userAgent || '';
    const screenResolution = body.screenResolution || '';
    const viewportSize = body.viewportSize || '';
    const timeZone = body.timeZone || '';
    const language = body.language || '';
    const utmSource = body.utmSource || null;
    const utmMedium = body.utmMedium || null;
    const utmCampaign = body.utmCampaign || null;
    const utmContent = body.utmContent || null;
    const utmTerm = body.utmTerm || null;
    const gclid = body.gclid || null;
    const fbclid = body.fbclid || null;
    const timeOnPage = body.timeOnPage || null;
    const scrollDepth = body.scrollDepth || 0;
    const interactions = body.interactions || 0;
    const isEntryPage = body.isEntryPage || false;
    const isExitPage = body.isExitPage || false;

    const clientIP = c.req.header('CF-Connecting-IP') ||
                    c.req.header('X-Forwarded-For') ||
                    c.req.header('X-Real-IP') ||
                    'unknown';

    const country = c.req.header('CF-IPCountry') || 'unknown';
    const city = 'unknown';

    const deviceType = userAgent?.toLowerCase().includes('mobile') ? 'mobile' :
                      userAgent?.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';

    let browser = 'unknown';
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
      else if (ua.includes('firefox')) browser = 'firefox';
      else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
      else if (ua.includes('edg')) browser = 'edge';
      else if (ua.includes('opera')) browser = 'opera';
    }

    let os = 'unknown';
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (ua.includes('windows')) os = 'windows';
      else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macos';
      else if (ua.includes('linux')) os = 'linux';
      else if (ua.includes('android')) os = 'android';
      else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios';
    }

    const visitId = `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db
      .prepare(`
        INSERT INTO page_visits (
          id, session_id, user_id, page_url, page_title, referrer, user_agent,
          ip_address, country, city, device_type, browser, os, screen_resolution,
          viewport_size, time_zone, language, utm_source, utm_medium, utm_campaign,
          utm_content, utm_term, gclid, fbclid, entry_page, exit_page, time_on_page,
          scroll_depth, interactions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        visitId, sessionId, userId, pageUrl, pageTitle, referrer, userAgent,
        clientIP, country, city, deviceType, browser, os, screenResolution,
        viewportSize, timeZone, language, utmSource, utmMedium, utmCampaign,
        utmContent, utmTerm, gclid, fbclid, isEntryPage, isExitPage, timeOnPage,
        scrollDepth, interactions, new Date().toISOString()
      )
      .run();

    if (sessionId) {
      const existingSession = await db
        .prepare('SELECT id FROM sessions WHERE id = ?')
        .bind(sessionId)
        .first();

      if (!existingSession) {
        await db
          .prepare(`
            INSERT INTO sessions (
              id, user_id, ip_address, user_agent, referrer, landing_page,
              browser, os, device_type, country, city, screen_resolution,
              time_zone, language, utm_source, utm_medium, utm_campaign,
              utm_content, utm_term, gclid, fbclid, session_start, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            sessionId, userId, clientIP, userAgent, referrer, pageUrl,
            browser, os, deviceType, country, city, screenResolution,
            timeZone, language, utmSource, utmMedium, utmCampaign,
            utmContent, utmTerm, gclid, fbclid, new Date().toISOString(),
            new Date().toISOString()
          )
          .run();
      } else {
        await db
          .prepare(`
            UPDATE sessions
            SET page_views = page_views + 1,
                session_end = ?,
                updated_at = ?
            WHERE id = ?
          `)
          .bind(new Date().toISOString(), new Date().toISOString(), sessionId)
          .run();
      }
    }

    return c.json({ success: true, visitId }, 200);
  } catch (error) {
    console.error('Page visit tracking error:', error);
    return c.json({ error: 'Failed to track page visit' }, 500);
  }
});

trackingRoutes.get('/analytics/visits', async (c) => {
  try {
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const visits = await db
      .prepare(`
        SELECT
          pv.*,
          s.page_views as session_page_views,
          s.total_time as session_duration
        FROM page_visits pv
        LEFT JOIN sessions s ON pv.session_id = s.id
        ORDER BY pv.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .bind(limit, offset)
      .all();

    const total = await db
      .prepare('SELECT COUNT(*) as count FROM page_visits')
      .first();

    return c.json({
      visits: visits.results || visits,
      total: total?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});