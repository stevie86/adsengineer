import { Hono } from 'hono';
import type { AppEnv } from '../types';

export interface CustomerSelfServicePortal {
  customer_id: string;
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    industry?: string;
  };
  account_settings: {
    auto_optimization: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      conversion_alerts: boolean;
    };
  privacy_settings: {
      data_export: boolean;
      marketing_communications: boolean;
      analytics_access: boolean;
  };
  access_controls: {
    team_members: Array<{
      user_id: string;
      role: 'admin' | 'editor' | 'viewer';
      permissions: string[];
    }>;
    billing_info: {
      current_plan: string;
      usage_stats: {
        conversions_tracked: number;
        api_calls: number;
        storage_used: number;
      };
      payment_methods: Array<{
        type: 'card' | 'bank' | 'paypal';
        last_four: string;
      expires: string;
    }>;
    dashboard_preferences: {
      default_date_range: string;
      default_currency: string;
      timezone: string;
      refresh_interval: number;
    };
}

export interface TikTokCustomerMetrics {
  customer_id: string;
  total_conversions: number;
  total_spend: number;
  conversion_rate: number;
  avg_conversion_value: number;
  top_performing_campaigns: Array<{
    campaign_id: string;
    campaign_name: string;
    conversions: number;
    spend: number;
    cpa: number;
    roas: number;
    start_date: string;
    end_date: string;
  }>;
}

export class CustomerSelfServicePortal {
  constructor(private db: D1Database) {}

  async getCustomerProfile(customerId: string): Promise<CustomerSelfServicePortal['personal_info']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            first_name, last_name, email, phone, company, industry
          FROM customers 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      return result || {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        industry: ''
      };

    } catch (error) {
      console.error('Get customer profile error:', error);
      throw new Error(`Failed to get customer profile: ${error.message}`);
    }
  }

  async updateCustomerProfile(customerId: string, profile: Partial<CustomerSelfServicePortal['personal_info']>): Promise<boolean> {
    try {
      const updateFields = Object.keys(profile)
        .map(key => `${key} = ?`)
        .join(', ');

      await this.db
        .prepare(`
          UPDATE customers 
          SET ${updateFields}
          WHERE customer_id = ?
        `)
        .bind(customerId, ...Object.values(profile))
        .run();

      console.log('Customer profile updated successfully');
      return true;

    } catch (error) {
      console.error('Update customer profile error:', error);
      throw new Error(`Failed to update customer profile: ${error.message}`);
    }
  }

  async getAccountSettings(customerId: string): Promise<CustomerSelfServicePortal['account_settings']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            auto_optimization, notifications_email, notifications_sms, notifications_push, 
            conversion_alerts, privacy_data_export, marketing_communications, analytics_access
          FROM customer_settings 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      return result || {
        auto_optimization: false,
        notifications: {
          email: false,
          sms: false,
          push: false,
          conversion_alerts: false
        },
        privacy_settings: {
          data_export: false,
          marketing_communications: false,
          analytics_access: false
        }
      };

    } catch (error) {
      console.error('Get account settings error:', error);
      throw new Error(`Failed to get account settings: ${error.message}`);
    }
  }

  async updateAccountSettings(customerId: string, settings: Partial<CustomerSelfServicePortal['account_settings']>): Promise<boolean> {
    try {
      const updateFields = Object.keys(settings)
        .map(key => `${key} = ?`)
        .join(', ');

      await this.db
        .prepare(`
          UPDATE customer_settings 
          SET ${updateFields}
          WHERE customer_id = ?
        `)
        .bind(customerId, ...Object.values(settings))
        .run();

      console.log('Account settings updated successfully');
      return true;

    } catch (error) {
      console.error('Update account settings error:', error);
      throw new Error(`Failed to update account settings: ${error.message}`);
    }
  }

  async getPrivacySettings(customerId: string): Promise<CustomerSelfServicePortal['privacy_settings']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            data_export, marketing_communications, analytics_access
          FROM privacy_settings 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      return result || {
        data_export: false,
        marketing_communications: false,
        analytics_access: false
      };

    } catch (error) {
      console.error('Get privacy settings error:', error);
      throw new Error(`Failed to get privacy settings: ${error.message}`);
    }
  }

  async updatePrivacySettings(customerId: string, settings: Partial<CustomerSelfServicePortal['privacy_settings']>): Promise<boolean> {
    try {
      const updateFields = Object.keys(settings)
        .map(key => `${key} = ?`)
        .join(', ');

      await this.db
        .prepare(`
          UPDATE privacy_settings 
          SET ${updateFields}
          WHERE customer_id = ?
        `)
        .bind(customerId, ...Object.values(settings))
        .run();

      console.log('Privacy settings updated successfully');
      return true;

    } catch (error) {
      console.error('Update privacy settings error:', error);
      throw new Error(`Failed to update privacy settings: ${error.message}`);
    }
  }

  async getAccessControls(customerId: string): Promise<CustomerSelfServicePortal['access_controls']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            user_id, role, permissions
          FROM access_controls 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .all();

      return result || [];

    } catch (error) {
      console.error('Get access controls error:', error);
      throw new Error(`Failed to get access controls: ${error.message}`);
    }
  }

  async updateAccessControls(customerId: string, controls: CustomerSelfServicePortal['access_controls']): Promise<boolean> {
    try {
      await this.db
        .prepare(`
          INSERT INTO access_controls 
          (customer_id, user_id, role, permissions)
          VALUES (?, ?, ?, ?)
        `)
        .bind(customerId, controls.user_id, controls.role, JSON.stringify(controls.permissions));

      console.log('Access controls updated successfully');
      return true;

    } catch (error) {
      console.error('Update access controls error:', error);
      throw new Error(`Failed to update access controls: ${error.message}`);
    }
  }

  async getBillingInfo(customerId: string): Promise<CustomerSelfServicePortal['billing_info']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            current_plan, usage_stats
          FROM billing_info 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      if (!result) {
        const statsQuery = await this.db
          .prepare(`
            SELECT 
              COUNT(*) as total_conversions,
              SUM(conversion_value) as total_revenue
            FROM conversions c
            JOIN leads l ON c.lead_id = l.lead_id
            WHERE c.customer_id = ? AND c.event_name = 'CompletePayment'
          `)
          .bind(customerId)
          .first();

        return {
          current_plan: 'starter',
          usage_stats: {
            conversions_tracked: 0,
            api_calls: 0,
            storage_used: 0
          }
        };
      }

      return result;

    } catch (error) {
      console.error('Get billing info error:', error);
      throw new Error(`Failed to get billing info: ${error.message}`);
    }
  }

  async updateBillingPlan(customerId: string, plan: string): Promise<boolean> {
    try {
      await this.db
        .prepare(`
          UPDATE billing_info 
          SET current_plan = ?
          WHERE customer_id = ?
        `)
        .bind(customerId, plan)
        .run();

      console.log(`Billing plan updated to: ${plan}`);
      return true;

    } catch (error) {
      console.error('Update billing plan error:', error);
      throw new Error(`Failed to update billing plan: ${error.message}`);
    }
  }

  async getDashboardPreferences(customerId: string): Promise<CustomerSelfServicePortal['dashboard_preferences']> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            default_date_range, default_currency, timezone, refresh_interval
          FROM dashboard_preferences 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      return result || {
        default_date_range: 'last_30_days',
        default_currency: 'USD',
        timezone: 'UTC',
        refresh_interval: 300
      };

    } catch (error) {
      console.error('Get dashboard preferences error:', error);
      throw new Error(`Failed to get dashboard preferences: ${error.message}`);
    }
  }

  async updateDashboardPreferences(customerId: string, preferences: Partial<CustomerSelfServicePortal['dashboard_preferences']>): Promise<boolean> {
    try {
      const updateFields = Object.keys(preferences)
        .map(key => `${key} = ?`)
        .join(', ');

      await this.db
        .prepare(`
          UPDATE dashboard_preferences 
          SET ${updateFields}
          WHERE customer_id = ?
        `)
        .bind(customerId, ...Object.values(preferences))
        .run();

      console.log('Dashboard preferences updated successfully');
      return true;

    } catch (error) {
      console.error('Update dashboard preferences error:', error);
      throw new Error(`Failed to update dashboard preferences: ${error.message}`);
    }
  }

  async getCustomerMetrics(customerId: string, period?: string): Promise<TikTokCustomerMetrics> {
    try {
      const periodFilter = this.getPeriodFilter(period);
      
      const [customerProfile] = await this.db
        .prepare(`
          SELECT first_name, last_name, email, company, industry
          FROM customers 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      const [billingInfo] = await this.db
        .prepare(`
          SELECT current_plan, usage_stats
          FROM billing_info 
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      const [usageStats] = billingInfo?.usage_stats || {
        conversions_tracked: 0,
        api_calls: 0,
        storage_used: 0
      };

      const metricsQuery = `
        SELECT 
          COUNT(CASE WHEN c.ad_platform = 'tiktok' AND c.event_name = 'CompletePayment' THEN 1 END) as total_conversions,
          COALESCE(SUM(CASE WHEN c.ad_platform = 'tiktok' AND c.event_name = 'CompletePayment' THEN c.conversion_value ELSE 0 END), 0) as total_revenue,
          AVG(CASE WHEN c.ad_platform = 'tiktok' AND c.event_name = 'CompletePayment' THEN c.confidence_score END) as avg_confidence,
          COUNT(DISTINCT c.lead_id) as unique_campaigns,
          COUNT(DISTINCT CASE WHEN c.event_time >= ${periodFilter.start} THEN c.lead_id END) as recent_conversions
        FROM conversions c
        JOIN leads l ON c.lead_id = l.lead_id
        WHERE c.customer_id = ? AND c.ad_platform = 'tiktok'
      `;

      const [metricsResult] = await this.db.prepare(metricsQuery).bind(customerId).get();

      const customerMetrics: TikTokCustomerMetrics = {
        customer_id: customerId,
        total_conversions: Number(metricsResult[0]?.total_conversions) || 0,
        total_spend: 0,
        conversion_rate: metricsResult.length > 0 ? 
          Number(metricsResult[0]?.total_conversions) / Number(metricsResult[0]?.unique_campaigns || 1) : 0,
        avg_conversion_value: Number(metricsResult[0]?.avg_confidence) || 0,
        top_performing_campaigns: await this.getTopTikTokCampaigns(customerId),
        total_revenue: Number(metricsResult[0]?.total_revenue) || 0,
        conversion_rate: 0,
        avg_conversion_value: 0,
        current_plan: billingInfo?.current_plan || 'starter',
        total_spend: usageStats?.conversions_tracked || 0,
        api_calls: usageStats?.api_calls || 0,
        storage_used: usageStats?.storage_used || 0,
        personal_info: customerProfile || {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          industry: ''
        }
      };

      return customerMetrics;

    } catch (error) {
      console.error('Get customer metrics error:', error);
      throw new Error(`Failed to get customer metrics: ${error.message}`);
    }
  }

  private getPeriodFilter(period: string): { start: string; end: string } {
    const now = new Date();
    
    switch (period) {
      case 'last_7_days':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case 'last_30_days':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      default:
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
    }
  }

  private async getTopTikTokCampaigns(customerId: string): Promise<any[]> {
    const query = `
      SELECT 
        c.campaign_id,
        COUNT(c.conversion_value) as conversions,
        SUM(c.conversion_value) as revenue
        COUNT(DISTINCT l.lead_id) as unique_leads
      FROM conversions c
      JOIN leads l ON c.lead_id = l.lead_id
      WHERE c.customer_id = ? AND c.ad_platform = 'tiktok' AND c.event_name = 'CompletePayment'
      GROUP BY c.campaign_id
      ORDER BY revenue DESC
      LIMIT 10
    `;

    return await this.db.prepare(query).bind(customerId).all();
  }
}