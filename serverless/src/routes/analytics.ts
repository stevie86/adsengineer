import { Hono } from 'hono';
import type { AppEnv } from '../types';

const analyticsRoutes = new Hono<AppEnv>();

// Technology analytics endpoints
analyticsRoutes.get('/analytics/technologies', async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Technology usage by category with support status
    const techByCategory = await db.prepare(`
      SELECT
        t.category,
        t.name,
        COUNT(lt.lead_id) as lead_count,
        AVG(lt.confidence_score) as avg_confidence,
        CASE
          WHEN t.description LIKE '%FULLY SUPPORTED%' THEN 'supported'
          WHEN t.description LIKE '%PARTIALLY SUPPORTED%' THEN 'partial'
          WHEN t.description LIKE '%NOT SUPPORTED%' THEN 'not_supported'
          ELSE 'unknown'
        END as support_status
      FROM technologies t
      LEFT JOIN lead_technologies lt ON t.id = lt.technology_id
      LEFT JOIN leads l ON lt.lead_id = l.id
      WHERE l.agency_id = ?
      GROUP BY t.category, t.name, t.description
      ORDER BY lead_count DESC
    `).bind(auth.org_id).all();

    // Technology detection methods
    const detectionMethods = await db.prepare(`
      SELECT
        detected_via,
        COUNT(*) as detection_count
      FROM lead_technologies lt
      JOIN leads l ON lt.lead_id = l.id
      WHERE l.agency_id = ?
      GROUP BY detected_via
    `).bind(auth.org_id).all();

    // Technology combinations (leads with multiple technologies)
    const multiTechLeads = await db.prepare(`
      SELECT
        l.id,
        COUNT(lt.technology_id) as tech_count,
        GROUP_CONCAT(t.name) as technologies
      FROM leads l
      JOIN lead_technologies lt ON l.id = lt.lead_id
      JOIN technologies t ON lt.technology_id = t.id
      WHERE l.agency_id = ?
      GROUP BY l.id
      HAVING tech_count > 1
      ORDER BY tech_count DESC
      LIMIT 20
    `).bind(auth.org_id).all();

    return c.json({
      success: true,
      analytics: {
        technology_usage: techByCategory.results || techByCategory,
        detection_methods: detectionMethods.results || detectionMethods,
        multi_technology_leads: multiTechLeads.results || multiTechLeads
      }
    });
  } catch (error) {
    console.error('Technology analytics error:', error);
    return c.json({
      error: 'Analytics retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Technology detection endpoint
analyticsRoutes.post('/detect-technologies', async (c) => {
  try {
    const auth = c.get('auth');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const { url, html_content, headers } = body;

    // Basic technology detection logic
    const detected: TechnologyDetection[] = [];

    // Check for common platforms
    if (headers?.['x-shopify-stage'] || html_content?.includes('cdn.shopify.com')) {
      detected.push({
        name: 'Shopify',
        category: 'ecommerce',
        confidence: 0.9,
        detected_via: 'analysis'
      });
    }

    if (html_content?.includes('gohighlevel.com') || headers?.['x-ghl-'] || url?.includes('gohighlevel')) {
      detected.push({
        name: 'GoHighLevel',
        category: 'crm',
        confidence: 0.8,
        detected_via: 'analysis'
      });
    }

    if (html_content?.includes('googletagmanager.com') || html_content?.includes('gtag(')) {
      detected.push({
        name: 'Google Tag Manager',
        category: 'analytics',
        confidence: 0.95,
        detected_via: 'analysis'
      });
    }

    if (html_content?.includes('googleadservices.com') || html_content?.includes('gclid')) {
      detected.push({
        name: 'Google Ads',
        category: 'ads',
        confidence: 0.9,
        detected_via: 'analysis'
      });
    }

    return c.json({
      success: true,
      detected_technologies: detected,
      detection_method: 'analysis'
    });
  } catch (error) {
    console.error('Technology detection error:', error);
    return c.json({
      error: 'Technology detection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { analyticsRoutes };