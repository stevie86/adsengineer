import { decryptCredential } from '../services/encryption';

export function createDb(d1: D1Database) {
  return {
    async insertLead(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1
        .prepare(`
        INSERT INTO leads (id, org_id, site_id, gclid, fbclid, external_id, email, phone, landing_page,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          lead_score, base_value_cents, adjusted_value_cents, value_multiplier, status, vertical, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          data.org_id,
          data.site_id,
          data.gclid || null,
          data.fbclid || null,
          data.external_id || null,
          data.email,
          data.phone || null,
          data.landing_page || null,
          data.utm?.source || null,
          data.utm?.medium || null,
          data.utm?.campaign || null,
          data.utm?.content || null,
          data.utm?.term || null,
          data.lead_score || 0,
          data.base_value_cents || 0,
          data.adjusted_value_cents || 0,
          data.value_multiplier || 1.0,
          data.status || 'new',
          data.vertical || null,
          data.created_at,
          data.updated_at || null
        )
        .run();

      return { id };
    },

    // Agency management methods
    async getAgencyById(id: string): Promise<any | null> {
      const result = await d1.prepare('SELECT * FROM agencies WHERE id = ?').bind(id).first();
      return result || null;
    },

    async getAgencyByCustomerId(customerId: string): Promise<any | null> {
      const result = await d1
        .prepare('SELECT * FROM agencies WHERE customer_id = ?')
        .bind(customerId)
        .first();
      return result || null;
    },

    async insertAgency(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1
        .prepare(`
        INSERT INTO agencies (id, name, customer_id, google_ads_config, conversion_action_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          data.name,
          data.customer_id,
          data.google_ads_config, // Should be encrypted JSON
          data.conversion_action_id || null,
          data.status || 'active',
          data.created_at,
          data.updated_at || null
        )
        .run();

      return { id };
    },

    async updateAgency(id: string, data: Record<string, any>): Promise<boolean> {
      const fields: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) return false;

      values.push(id);
      const result = await d1
        .prepare(`UPDATE agencies SET ${fields.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
      return result.meta.changes > 0;
    },

    // Audit log methods
    async createAuditLog(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1
        .prepare(`
        INSERT INTO audit_logs (id, agency_id, action, result, error, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          data.agency_id,
          data.action,
          data.result,
          data.error || null,
          data.details || null,
          data.created_at
        )
        .run();

      return { id };
    },

    async getAuditLogs(
      agencyId: string,
      options: { limit?: number; offset?: number; action?: string } = {}
    ): Promise<any[]> {
      const { limit = 50, offset = 0, action } = options;
      let query = 'SELECT * FROM audit_logs WHERE agency_id = ?';
      const params: any[] = [agencyId];

      if (action) {
        query += ' AND action = ?';
        params.push(action);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await d1
        .prepare(query)
        .bind(...params)
        .all();
      return result.results || [];
    },

    async insertTrigger(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1
        .prepare(`
        INSERT INTO optimization_triggers (id, org_id, trigger_type, lead_count, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
        .bind(id, data.org_id, data.trigger_type, data.lead_count || 0, data.created_at)
        .run();
      return { id };
    },

    async getLeadsByOrg(
      orgId: string,
      options: { status?: string; vertical?: string; limit?: number; offset?: number } = {}
    ): Promise<any[]> {
      const { status, vertical, limit = 50, offset = 0 } = options;
      let query = 'SELECT * FROM leads WHERE org_id = ?';
      const params: any[] = [orgId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (vertical) {
        query += ' AND vertical = ?';
        params.push(vertical);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await d1
        .prepare(query)
        .bind(...params)
        .all();
      return result.results || [];
    },

    async getLeadById(id: string, orgId: string): Promise<any | null> {
      const result = await d1
        .prepare('SELECT * FROM leads WHERE id = ? AND org_id = ?')
        .bind(id, orgId)
        .first();
      return result || null;
    },

    async updateLead(id: string, orgId: string, data: Record<string, any>): Promise<boolean> {
      const fields: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (key !== 'id' && key !== 'org_id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) return false;

      values.push(id, orgId);
      const result = await d1
        .prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND org_id = ?`)
        .bind(...values)
        .run();
      return result.meta.changes > 0;
    },

    async countLeadsByOrg(
      orgId: string,
      options: { status?: string; vertical?: string } = {}
    ): Promise<number> {
      const { status, vertical } = options;
      let query = 'SELECT COUNT(*) as count FROM leads WHERE org_id = ?';
      const params: any[] = [orgId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (vertical) {
        query += ' AND vertical = ?';
        params.push(vertical);
      }

      const result = await d1
        .prepare(query)
        .bind(...params)
        .first<{ count: number }>();
      return result?.count || 0;
    },

    // Encrypted credential management
    async getAgencyCredentials(agencyId: string): Promise<Record<string, any> | null> {
      const agency = await d1
        .prepare('SELECT google_ads_config, meta_config, stripe_config FROM agencies WHERE id = ?')
        .bind(agencyId)
        .first();

      if (!agency) return null;

      try {
        const { decryptCredential } = await import('../services/encryption');
        const credentials: Record<string, any> = {};

        if (agency.google_ads_config) {
          credentials.googleAds = JSON.parse(
            await decryptCredential(JSON.parse(agency.google_ads_config), `agency-${agencyId}-googleAds`)
          );
        }
        if (agency.meta_config) {
          credentials.meta = JSON.parse(
            await decryptCredential(JSON.parse(agency.meta_config), `agency-${agencyId}-meta`)
          );
        }
        if (agency.stripe_config) {
          credentials.stripe = JSON.parse(
            await decryptCredential(JSON.parse(agency.stripe_config), `agency-${agencyId}-stripe`)
          );
        }

        return credentials;
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        return null;
      }
    },

    async validateCredentialFormat(platform: string, credentials: any): Promise<{ valid: boolean; errors?: string[] }> {
      try {
        switch (platform) {
          case 'googleAds':
            if (!credentials.apiKey || !credentials.clientId || !credentials.clientSecret || !credentials.developerToken) {
              return {
                valid: false,
                errors: ['Google Ads credentials require apiKey, clientId, clientSecret, and developerToken']
              };
            }
            // Basic format validation
            if (typeof credentials.apiKey !== 'string' || !credentials.apiKey.startsWith('AIza')) {
              return { valid: false, errors: ['Invalid Google Ads API key format'] };
            }
            break;

          case 'stripe':
            if (!credentials.secretKey || !credentials.publishableKey) {
              return {
                valid: false,
                errors: ['Stripe credentials require secretKey and publishableKey']
              };
            }
            if (!credentials.secretKey.startsWith('sk_') || !credentials.publishableKey.startsWith('pk_')) {
              return { valid: false, errors: ['Invalid Stripe key format'] };
            }
            break;

          case 'meta':
            if (!credentials.accessToken || !credentials.appId || !credentials.appSecret) {
              return {
                valid: false,
                errors: ['Meta credentials require accessToken, appId, and appSecret']
              };
            }
            break;

          default:
            return { valid: false, errors: [`Unknown platform: ${platform}`] };
        }

        return { valid: true };
      } catch (_error) {
        return { valid: false, errors: ['Internal validation error'] };
      }
    },

    async updateAgencyCredentials(
      agencyId: string,
      credentials: {
        googleAds?: {
          apiKey: string;
          clientId: string;
          clientSecret: string;
          developerToken: string;
        };
        meta?: { accessToken: string; appId: string; appSecret: string };
        stripe?: { secretKey: string; publishableKey: string };
      }
    ): Promise<boolean> {
      try {
        // Import encryption service dynamically to avoid circular dependencies
        const { encryptCredential } = await import('../services/encryption');

        const encryptedCredentials: Record<string, string> = {};

        // Encrypt each credential type
        for (const [platform, creds] of Object.entries(credentials)) {
          if (creds) {
            encryptedCredentials[platform] = JSON.stringify(
              await encryptCredential(JSON.stringify(creds), `agency-${agencyId}-${platform}`)
            );
          }
        }

        // Update the agency record with encrypted credentials
        await d1
          .prepare(`
          UPDATE agencies
          SET google_ads_config = ?, meta_config = ?, stripe_config = ?, updated_at = ?
          WHERE id = ?
        `)
          .bind(
            encryptedCredentials.googleAds || null,
            encryptedCredentials.meta || null,
            encryptedCredentials.stripe || null,
            new Date().toISOString(),
            agencyId
          )
          .run();

        return true;
      } catch (error) {
        console.error('Failed to validate credential format:', error);
        return { valid: false, errors: ['Internal validation error'] };
      }
    },

    // Custom events management
    async insertCustomEvent(data: {
      id?: string;
      org_id: string;
      site_id: string;
      event_name: string;
      event_value?: number;
      event_currency?: string;
      customer_email?: string;
      gclid_hash?: string;
      event_timestamp?: string;
      metadata?: Record<string, any>;
    }): Promise<{ id: string }> {
      const id = data.id || crypto.randomUUID();
      await d1
        .prepare(`
          INSERT INTO custom_events (
            id, org_id, site_id, event_name, event_value, event_currency,
            customer_email, gclid_hash, event_timestamp, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          data.org_id,
          data.site_id,
          data.event_name,
          data.event_value || null,
          data.event_currency || 'USD',
          data.customer_email || null,
          data.gclid_hash || null,
          data.event_timestamp || new Date().toISOString(),
          JSON.stringify(data.metadata || {}),
          new Date().toISOString()
        )
        .run();

      return { id };
    },

    async getCustomEventsByOrg(
      orgId: string,
      options: {
        siteId?: string;
        eventName?: string;
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
      } = {}
    ): Promise<any[]> {
      const { siteId, eventName, limit = 50, offset = 0, startDate, endDate } = options;

      let query = 'SELECT * FROM custom_events WHERE org_id = ?';
      const params: any[] = [orgId];

      if (siteId) {
        query += ' AND site_id = ?';
        params.push(siteId);
      }
      if (eventName) {
        query += ' AND event_name = ?';
        params.push(eventName);
      }
      if (startDate) {
        query += ' AND event_timestamp >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND event_timestamp <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await d1
        .prepare(query)
        .bind(...params)
        .all();
      return result.results || [];
    },

    async countCustomEventsByOrg(
      orgId: string,
      options: { siteId?: string; eventName?: string } = {}
    ): Promise<number> {
      const { siteId, eventName } = options;

      let query = 'SELECT COUNT(*) as count FROM custom_events WHERE org_id = ?';
      const params: any[] = [orgId];

      if (siteId) {
        query += ' AND site_id = ?';
        params.push(siteId);
      }
      if (eventName) {
        query += ' AND event_name = ?';
        params.push(eventName);
      }

      const result = await d1
        .prepare(query)
        .bind(...params)
        .first<{ count: number }>();
      return result?.count || 0;
    },
  };
}

export type Database = ReturnType<typeof createDb>;
