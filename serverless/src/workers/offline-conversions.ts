import {
  ConversionData,
  formatConversionTime,
  GoogleAdsCredentials,
  GoogleAdsError,
  UploadResult,
  uploadConversion,
} from '../services/google-ads';
import type { AppEnv } from '../types';

export interface AgencyGoogleAdsConfig {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  customer_id: string;
  developer_token: string;
  login_customer_id?: string;
  conversion_action_id: string;
}

export interface ConversionUploadData {
  agency_id: string;
  conversion_time: string;
  conversion_value: number;
  currency?: string;
  gclid?: string;
  order_id?: string;
  first_party_id?: string;
}

export interface ConversionUploadResult {
  success: boolean;
  conversion_id?: string;
  upload_time: string;
  gclid_preserved: boolean;
  error_message?: string;
}

export class OfflineConversionWorker {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async uploadOfflineConversion(
    conversionData: ConversionUploadData
  ): Promise<ConversionUploadResult> {
    const agencyId = conversionData.agency_id;

    const agencyResult = await this.db
      .prepare('SELECT * FROM agencies WHERE id = ?')
      .bind(agencyId)
      .first();

    if (!agencyResult || !agencyResult.google_ads_config) {
      throw new Error(`Google Ads not configured for agency ${agencyId}`);
    }

    const config: AgencyGoogleAdsConfig = JSON.parse(agencyResult.google_ads_config as string);

    const credentials: GoogleAdsCredentials = {
      clientId: config.client_id,
      clientSecret: config.client_secret,
      refreshToken: config.refresh_token,
      developerToken: config.developer_token,
      customerId: config.customer_id,
      loginCustomerId: config.login_customer_id,
    };

    const conversionPayload: ConversionData = {
      gclid: conversionData.gclid,
      conversionActionId: `customers/${config.customer_id}/conversionActions/${config.conversion_action_id}`,
      conversionValue: conversionData.conversion_value,
      currencyCode: conversionData.currency || 'USD',
      conversionTime: conversionData.conversion_time,
      orderId: conversionData.order_id,
    };

    try {
      const result = await uploadConversion(credentials, conversionPayload);

      await this.createAuditLog({
        agency_id: agencyId,
        action: 'offline_conversion_upload',
        result: result.success ? 'success' : 'partial_failure',
        conversion_id: result.conversionAction,
        details: {
          gclid: conversionData.gclid,
          value: conversionData.conversion_value,
          first_party_id: conversionData.first_party_id,
          timestamp: new Date().toISOString(),
          errors: result.errors,
        },
      });

      return {
        success: result.success,
        conversion_id: result.conversionAction,
        upload_time: result.uploadDateTime || new Date().toISOString(),
        gclid_preserved: !!conversionData.gclid,
        error_message: result.errors?.join(', '),
      };
    } catch (error) {
      const errorMessage =
        error instanceof GoogleAdsError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error';

      await this.createAuditLog({
        agency_id: agencyId,
        action: 'offline_conversion_upload',
        result: 'failed',
        error: errorMessage,
        details: {
          gclid: conversionData.gclid,
          value: conversionData.conversion_value,
          retry_recommended: true,
        },
      });

      throw error;
    }
  }

  private async createAuditLog(logEntry: {
    agency_id: string;
    action: string;
    result: string;
    conversion_id?: string;
    error?: string;
    details: Record<string, unknown>;
  }): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO audit_logs (agency_id, action, result, error, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        logEntry.agency_id,
        logEntry.action,
        logEntry.result,
        logEntry.error || null,
        JSON.stringify(logEntry.details),
        new Date().toISOString()
      )
      .run();
  }

  async validateAgencyCredentials(agencyId: string): Promise<boolean> {
    try {
      const agencyResult = await this.db
        .prepare('SELECT * FROM agencies WHERE id = ?')
        .bind(agencyId)
        .first();

      if (!agencyResult || !agencyResult.google_ads_config) {
        return false;
      }

      const config: AgencyGoogleAdsConfig = JSON.parse(agencyResult.google_ads_config as string);

      const credentials: GoogleAdsCredentials = {
        clientId: config.client_id,
        clientSecret: config.client_secret,
        refreshToken: config.refresh_token,
        developerToken: config.developer_token,
        customerId: config.customer_id,
        loginCustomerId: config.login_customer_id,
      };

      const testConversion: ConversionData = {
        conversionActionId: `customers/${config.customer_id}/conversionActions/${config.conversion_action_id}`,
        conversionValue: 0,
        conversionTime: formatConversionTime(new Date()),
      };

      await uploadConversion(credentials, testConversion);
      return true;
    } catch (error) {
      console.error(`Credential validation failed for agency ${agencyId}:`, error);
      return false;
    }
  }
}
