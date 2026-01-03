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
        console.error('Failed to update agency credentials:', error);
        return false;
      }
    },

    async getAgencyCredentials(agencyId: string): Promise<{
      googleAds?: any;
      meta?: any;
      stripe?: any;
    } | null> {
      try {
        const result = await d1
          .prepare(`
          SELECT google_ads_config, meta_config, stripe_config
          FROM agencies WHERE id = ?
        `)
          .bind(agencyId)
          .first();

        if (!result) return null;

        const credentials: Record<string, any> = {};

        // Decrypt each credential type
        if (result.google_ads_config) {
          try {
            const encryptedData = JSON.parse(result.google_ads_config);
            // @ts-ignore - TypeScript inference issue with dynamic import
            const decryptedValue: string = await decryptCredential(
              encryptedData,
              `agency-${agencyId}-googleAds`
            );
            credentials.googleAds = JSON.parse(decryptedValue as any);
          } catch (error) {
            console.error('Failed to decrypt Google Ads credentials:', error);
          }
        }

        if (result.meta_config) {
          try {
            const encryptedData = JSON.parse(result.meta_config);
            // @ts-ignore - TypeScript inference issue with dynamic import
            const decryptedValue: string = await decryptCredential(
              encryptedData,
              `agency-${agencyId}-meta`
            );
            credentials.meta = JSON.parse(decryptedValue as any);
          } catch (error) {
            console.error('Failed to decrypt Meta credentials:', error);
          }
        }

        if (result.stripe_config) {
          try {
            const encryptedData = JSON.parse(result.stripe_config);
            // @ts-ignore - TypeScript inference issue with dynamic import
            const decryptedValue: string = await decryptCredential(
              encryptedData,
              `agency-${agencyId}-stripe`
            );
            credentials.stripe = JSON.parse(decryptedValue as any);
          } catch (error) {
            console.error('Failed to decrypt Stripe credentials:', error);
          }
        }

        return credentials;
      } catch (error) {
        console.error('Failed to retrieve agency credentials:', error);
        return null;
      }
    },

    async validateCredentialFormat(
      platform: string,
      credentials: any
    ): Promise<{ valid: boolean; errors: string[] }> {
      const errors: string[] = [];

      switch (platform) {
        case 'googleAds':
          if (!credentials.apiKey?.startsWith('AIza'))
            errors.push('Invalid Google Ads API key format');
          if (!credentials.clientId) errors.push('Client ID required');
          if (!credentials.clientSecret) errors.push('Client secret required');
          if (!credentials.developerToken) errors.push('Developer token required');
          break;

        case 'meta':
          if (!credentials.accessToken) errors.push('Access token required');
          if (!credentials.appId) errors.push('App ID required');
          if (!credentials.appSecret) errors.push('App secret required');
          break;

        case 'stripe':
          if (!credentials.secretKey?.startsWith('sk_'))
            errors.push('Invalid Stripe secret key format');
          if (!credentials.publishableKey?.startsWith('pk_'))
            errors.push('Invalid Stripe publishable key format');
          break;

        default:
          errors.push(`Unknown platform: ${platform}`);
      }

      return { valid: errors.length === 0, errors };
    },
  };
}

export type Database = ReturnType<typeof createDb>;
