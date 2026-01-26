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
    };
    dashboard_preferences: {
      default_date_range: string;
      default_currency: string;
      timezone: string;
      refresh_interval: number;
    };
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

  async getCustomerProfile(
    customerId: string
  ): Promise<CustomerSelfServicePortal['personal_info']> {
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

      return (
        result || {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          industry: '',
        }
      );
    } catch (error) {
      console.error('Get customer profile error:', error);
      throw new Error(`Failed to get customer profile: ${error.message}`);
    }
  }

  async updateCustomerProfile(
    customerId: string,
    profile: Partial<CustomerSelfServicePortal['personal_info']>
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(`
          UPDATE customers
          SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, industry = ?
          WHERE customer_id = ?
        `)
        .bind(
          profile.first_name,
          profile.last_name,
          profile.email,
          profile.phone,
          profile.company,
          profile.industry,
          customerId
        )
        .run();

      return result.success;
    } catch (error) {
      console.error('Update customer profile error:', error);
      throw new Error(`Failed to update customer profile: ${error.message}`);
    }
  }

  async getCustomerMetrics(customerId: string): Promise<TikTokCustomerMetrics> {
    try {
      const result = await this.db
        .prepare(`
          SELECT
            customer_id,
            total_conversions,
            total_spend,
            conversion_rate,
            avg_conversion_value
          FROM customer_metrics
          WHERE customer_id = ?
        `)
        .bind(customerId)
        .first();

      if (!result) {
        return {
          customer_id: customerId,
          total_conversions: 0,
          total_spend: 0,
          conversion_rate: 0,
          avg_conversion_value: 0,
          top_performing_campaigns: [],
        };
      }

      return result;
    } catch (error) {
      console.error('Get customer metrics error:', error);
      throw new Error(`Failed to get customer metrics: ${error.message}`);
    }
  }

  async updateCustomerPreferences(
    customerId: string,
    preferences: Partial<CustomerSelfServicePortal['account_settings']>
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(`
          UPDATE customer_preferences
          SET auto_optimization = ?, notifications = ?
          WHERE customer_id = ?
        `)
        .bind(preferences.auto_optimization, JSON.stringify(preferences.notifications), customerId)
        .run();

      return result.success;
    } catch (error) {
      console.error('Update customer preferences error:', error);
      throw new Error(`Failed to update customer preferences: ${error.message}`);
    }
  }
}
