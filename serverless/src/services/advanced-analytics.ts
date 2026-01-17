import { Hono } from 'hono';
import type { AppEnv } from '../types';

export interface AnalyticsDashboard {
  period: string;
  metrics: {
    total_conversions: number;
    total_revenue: number;
    conversion_rate: number;
    top_conversions: any[];
    performance_score: number;
  };
  filters: {
    date_range: { start: string; end: string };
    platform: string;
    campaign?: string;
    customer_segment?: string;
  };
}

export interface CustomerMetrics {
  customer_id: string;
  total_spend: number;
  total_conversions: number;
  conversion_value: number;
  roi: number;
  lifetime_value: number;
  acquisition_cost: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  platform: string;
  total_spend: number;
  conversion_value: number;
}

export class AdvancedAnalyticsService {
  constructor(private db: D1Database) {}

  async getDashboardData(customerId: string, filters?: any): Promise<AnalyticsDashboard> {
    const periodFilter = this.getPeriodFilter(filters?.period || 'last_30_days');
    
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_conversions,
        COALESCE(SUM(conversion_value), 0) as total_revenue,
        CASE 
          WHEN COUNT(*) > 0 THEN COALESCE(SUM(conversion_value) / COUNT(*), 0)
          ELSE 0 
        END as conversion_rate,
          AVG(l.confidence_score) as avg_confidence,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM leads 
        WHERE l.customer_id = ?
      `;

    const metricsResult = await this.db.prepare(metricsQuery).bind(customerId).all();
      
    const metricsRow = metricsResult.results?.[0];
      
    const dashboardData: AnalyticsDashboard = {
      period: periodFilter.start,
      metrics: {
        total_conversions: Number(metricsRow?.total_conversions) || 0,
        total_revenue: Number(metricsRow?.total_revenue) || 0,
        conversion_rate: Number(metricsRow?.conversion_rate) || 0,
        performance_score: Number(metricsRow?.avg_confidence) || 0,
        top_conversions: await this.getTopConversions(customerId, filters)
      }
    };

    return dashboardData;
  }

  private getTopConversions(customerId: string, filters?: any): Promise<any[]> {
    let whereClause = 'WHERE l.customer_id = ?';
    const params = [customerId];
      
    if (filters?.date_range) {
      whereClause += ' AND l.event_time BETWEEN ? AND ?';
      params.push(filters.date_range.start, filters.date_range.end);
    }
      
    if (filters?.platform) {
      whereClause += ' AND l.ad_platform = ?';
      params.push(filters.platform);
    }

    const topConversionsQuery = `
      SELECT 
        l.event_name,
        l.conversion_value,
        l.event_time,
        c.name as customer_name
      FROM leads l
      JOIN conversions c ON l.lead_id = c.lead_id
      ${whereClause}
      ORDER BY l.conversion_value DESC
      LIMIT 10
    `;

    return await this.db.prepare(topConversionsQuery).bind(...params).all();
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
}