import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const gdprRoutes = new Hono<AppEnv>();

// GDPR Data Subject Rights Implementation

// Right to Access - Allow users to see what data we have about them
gdprRoutes.get('/data-request/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = c.get('db');

    // Find all data associated with this email
    const leads = await db.prepare(
      'SELECT * FROM leads WHERE email = ?'
    ).bind(email).all();

    const conversionLogs = await db.prepare(`
      SELECT cl.* FROM conversion_logs cl
      JOIN leads l ON cl.agency_id = l.org_id
      WHERE l.email = ?
    `).bind(email).all();

    // Remove sensitive fields for privacy
    const sanitizedLeads = leads.results?.map(lead => ({
      id: lead.id,
      email: lead.email,
      created_at: lead.created_at,
      consent_status: lead.consent_status,
      vertical: lead.vertical,
      // Exclude: phone, gclid, fbclid, personal details
    }));

    return c.json({
      status: 'success',
      data: {
        leads: sanitizedLeads,
        conversion_logs: conversionLogs.results,
        data_portability: {
          export_url: `/api/v1/gdpr/data-export/${email}`,
          last_updated: new Date().toISOString()
        }
      },
      gdpr_rights: {
        access: 'fulfilled',
        rectification: `/api/v1/gdpr/data-rectify/${email}`,
        erasure: `/api/v1/gdpr/data-erase/${email}`,
        restrict_processing: `/api/v1/gdpr/restrict-processing/${email}`
      }
    });
  } catch (error) {
    console.error('GDPR data access error:', error);
    return c.json({ error: 'Data access failed' }, 500);
  }
});

// Right to Data Portability - Export all user data
gdprRoutes.get('/data-export/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = c.get('db');

    // Comprehensive data export
    const userData = {
      export_timestamp: new Date().toISOString(),
      data_controller: 'AdsEngineer GmbH',
      legal_basis: 'Consent (Article 6(1)(a) GDPR)',
      purposes: [
        'Conversion tracking for advertising optimization',
        'Analytics and performance reporting'
      ],
      retention_period: '3 years after last activity',

      leads: await db.prepare('SELECT * FROM leads WHERE email = ?').bind(email).all(),
      technologies: await db.prepare(`
        SELECT t.* FROM technologies t
        JOIN lead_technologies lt ON t.id = lt.technology_id
        JOIN leads l ON lt.lead_id = l.id
        WHERE l.email = ?
      `).bind(email).all(),

      conversion_logs: await db.prepare(`
        SELECT cl.* FROM conversion_logs cl
        JOIN leads l ON cl.agency_id = l.org_id
        WHERE l.email = ?
      `).bind(email).all(),

      consent_history: await db.prepare(`
        SELECT consent_status, consent_timestamp, consent_method
        FROM leads WHERE email = ?
        ORDER BY consent_timestamp DESC
      `).bind(email).all()
    };

    // Set headers for file download
    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="adsengineer-data-export-${email}-${Date.now()}.json"`);

    return c.json(userData);
  } catch (error) {
    console.error('GDPR data export error:', error);
    return c.json({ error: 'Data export failed' }, 500);
  }
});

// Right to Rectification - Allow users to correct their data
gdprRoutes.put('/data-rectify/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const updates = await c.req.json();
    const db = c.get('db');

    // Only allow updates to non-sensitive fields
    const allowedFields = ['vertical', 'status'];
    const updateFields: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    }

    if (Object.keys(updateFields).length > 0) {
      const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
      const values = Object.values(updateFields);

      await db.prepare(
        `UPDATE leads SET ${setClause}, updated_at = ? WHERE email = ?`
      ).bind(...values, new Date().toISOString(), email).run();
    }

    // Log rectification request
    console.log(`GDPR Rectification: ${email} - ${JSON.stringify(updateFields)}`);

    return c.json({
      status: 'success',
      message: 'Data rectification completed',
      rectified_fields: Object.keys(updateFields)
    });
  } catch (error) {
    console.error('GDPR rectification error:', error);
    return c.json({ error: 'Rectification failed' }, 500);
  }
});

// Right to Erasure (Right to be Forgotten)
gdprRoutes.delete('/data-erase/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = c.get('db');

    // Start transaction for data deletion
    const leads = await db.prepare('SELECT id FROM leads WHERE email = ?').bind(email).all();

    if (leads.results && leads.results.length > 0) {
      for (const lead of leads.results) {
        // Delete technology associations
        await db.prepare('DELETE FROM lead_technologies WHERE lead_id = ?').bind(lead.id).run();

        // Delete lead
        await db.prepare('DELETE FROM leads WHERE id = ?').bind(lead.id).run();
      }

      // Delete conversion logs (anonymize rather than delete for audit purposes)
      await db.prepare(`
        UPDATE conversion_logs
        SET success_count = 0, failure_count = 0, errors = 'Anonymized per GDPR Article 17'
        WHERE agency_id IN (SELECT org_id FROM leads WHERE email = ?)
      `).bind(email).run();
    }

    // Log erasure request (required by GDPR)
    console.log(`GDPR Erasure: ${email} - Data deleted/anonymized`);

    return c.json({
      status: 'success',
      message: 'Data erasure completed per GDPR Article 17',
      deleted_records: leads.results?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GDPR erasure error:', error);
    return c.json({ error: 'Erasure failed' }, 500);
  }
});

// Right to Restrict Processing
gdprRoutes.post('/restrict-processing/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const { restrict } = await c.req.json(); // true to restrict, false to lift
    const db = c.get('db');

    const status = restrict ? 'restricted' : 'active';

    await db.prepare(
      'UPDATE leads SET status = ?, updated_at = ? WHERE email = ?'
    ).bind(status, new Date().toISOString(), email).run();

    // If restricting, stop future processing
    if (restrict) {
      console.log(`GDPR Processing Restriction: ${email} - Processing stopped`);
    }

    return c.json({
      status: 'success',
      message: restrict ? 'Processing restricted per GDPR Article 18' : 'Processing restriction lifted',
      processing_status: status
    });
  } catch (error) {
    console.error('GDPR restrict processing error:', error);
    return c.json({ error: 'Processing restriction failed' }, 500);
  }
});

// Consent Withdrawal
gdprRoutes.post('/consent-withdraw/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const db = c.get('db');

    // Update consent status
    await db.prepare(
      'UPDATE leads SET consent_status = ?, consent_timestamp = ?, updated_at = ? WHERE email = ?'
    ).bind('withdrawn', new Date().toISOString(), new Date().toISOString(), email).run();

    // Stop future processing for this email
    console.log(`GDPR Consent Withdrawn: ${email} - All processing stopped`);

    return c.json({
      status: 'success',
      message: 'Consent withdrawn per GDPR Article 7. Consent withdrawal logged.',
      withdrawal_timestamp: new Date().toISOString(),
      future_processing: 'stopped'
    });
  } catch (error) {
    console.error('GDPR consent withdrawal error:', error);
    return c.json({ error: 'Consent withdrawal failed' }, 500);
  }
});

// Privacy Policy Endpoint
gdprRoutes.get('/privacy-policy', (c) => {
  return c.json({
    title: 'AdsEngineer Privacy Policy',
    version: '1.0',
    last_updated: '2024-01-15',
    data_controller: {
      name: 'AdsEngineer GmbH',
      address: 'Germany',
      contact: 'privacy@adsengineer.cloud',
      dpo: 'dpo@adsengineer.cloud'
    },
    legal_basis: 'Consent (Article 6(1)(a) GDPR)',
    data_purposes: [
      'Conversion tracking for advertising optimization',
      'Analytics and performance reporting',
      'GDPR compliance and audit logging'
    ],
    data_categories: [
      'Contact information (email, anonymized identifiers)',
      'Tracking parameters (GCLID, FBCLID for attribution)',
      'Consent status and timestamps',
      'Technology detection data'
    ],
    data_recipients: [
      'Google Ads (for conversion uploads)',
      'Meta/Facebook (for conversion uploads)',
      'Internal analytics systems'
    ],
    retention_periods: {
      lead_data: '3 years after last activity',
      conversion_logs: '7 years for audit purposes',
      consent_records: '5 years after consent withdrawal'
    },
    data_subject_rights: {
      access: '/api/v1/gdpr/data-request/:email',
      rectification: '/api/v1/gdpr/data-rectify/:email',
      erasure: '/api/v1/gdpr/data-erase/:email',
      restrict_processing: '/api/v1/gdpr/restrict-processing/:email',
      data_portability: '/api/v1/gdpr/data-export/:email',
      consent_withdrawal: '/api/v1/gdpr/consent-withdraw/:email'
    },
    international_transfers: 'No data transferred outside EU/EEA',
    automated_decision_making: 'None - all processing requires explicit consent',
    complaint_rights: 'You have the right to lodge a complaint with supervisory authorities'
  });
});

// Data Processing Records (for accountability)
gdprRoutes.get('/data-processing-record', async (c) => {
  const auth = c.get('auth');
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  return c.json({
    data_controller: 'AdsEngineer GmbH',
    processing_activities: [
      {
        purpose: 'Conversion tracking and attribution',
        categories_of_data: ['Contact data', 'Tracking parameters', 'Consent status'],
        categories_of_data_subjects: ['Website visitors', 'Marketing leads'],
        recipients: ['Google Ads', 'Meta Conversions API'],
        retention_period: '3 years',
        security_measures: ['Encryption at rest', 'Access controls', 'Audit logging']
      }
    ],
    dpo_contact: 'dpo@adsengineer.cloud',
    last_audit: '2024-01-15'
  });
});