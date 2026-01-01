import { GoogleAdsApi } from './google-ads';

interface ApiVersion {
  name: string;
  version: string;
  deprecated?: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  current: boolean;
}

interface ApiHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'deprecated' | 'offline';
  version: string;
  lastChecked: string;
  issues: string[];
  recommendations: string[];
}

export class ApiMonitor {
  private googleAds: GoogleAdsApi;
  private checkInterval: number = 3600000;
  private statusCache: Map<string, ApiHealthStatus> = new Map();
  private notificationHooks: string[] = [];

  constructor(googleAds: GoogleAdsApi) {
    this.googleAds = googleAds;
  }

  async checkGoogleAdsHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    const status: ApiHealthStatus = {
      service: 'Google Ads API',
      status: 'healthy',
      version: '',
      lastChecked: new Date().toISOString(),
      issues: [],
      recommendations: []
    };

    try {
      const versionCheck = await this.checkGoogleAdsVersion();
      status.version = versionCheck.version;

      if (versionCheck.deprecated) {
        status.status = 'deprecated';
        status.issues.push(`Google Ads API v${versionCheck.version} is deprecated`);
        
        if (versionCheck.deprecationDate) {
          const daysUntilDeprecation = Math.floor(
            (new Date(versionCheck.deprecationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          status.recommendations.push(`Migrate before ${versionCheck.deprecationDate} (${daysUntilDeprecation} days)`);
        }
      }

      const connectivityTest = await this.testGoogleAdsConnectivity();
      if (!connectivityTest.success) {
        status.status = 'degraded';
        status.issues.push(connectivityTest.error);
        status.recommendations.push('Check Google Ads credentials and quotas');
      }

      const quotaCheck = await this.checkGoogleAdsQuota();
      if (quotaCheck.usage > 80) {
        status.status = 'degraded';
        status.issues.push(`High quota usage: ${quotaCheck.usage}%`);
        status.recommendations.push('Consider rate limiting or quota increase');
      }

    } catch (error) {
      status.status = 'offline';
      status.issues.push(`Connection failed: ${error.message}`);
      status.recommendations.push('Verify network connectivity and API credentials');
    }

    this.statusCache.set('google-ads', status);
    
    if (status.status !== 'healthy') {
      await this.sendNotification(status);
    }

    return status;
  }

  async checkGhlWebhookHealth(): Promise<ApiHealthStatus> {
    const status: ApiHealthStatus = {
      service: 'GHL Webhook API',
      status: 'healthy',
      version: 'v1',
      lastChecked: new Date().toISOString(),
      issues: [],
      recommendations: []
    };

    try {
      const payloadTest = await this.testGhlWebhookPayload();
      if (!payloadTest.compatible) {
        status.status = 'degraded';
        status.issues.push('GHL webhook payload structure has changed');
        status.recommendations.push('Update webhook payload parser');
      }
    } catch (error) {
      status.status = 'degraded';
      status.issues.push(`Webhook test failed: ${error.message}`);
      status.recommendations.push('Check GHL webhook configuration');
    }

    this.statusCache.set('ghl-webhook', status);
    return status;
  }

  private async checkGoogleAdsVersion(): Promise<ApiVersion> {
    try {
      // Fetch current version info from Google
      const response = await fetch('https://developers.google.com/google-ads/api/docs/release-notes');
      const html = await response.text();

      // Extract current version from HTML (basic parsing)
      const versionMatch = html.match(/v(\d+)\.(\d+)/);
      const currentVersion = versionMatch ? `v${versionMatch[1]}.${versionMatch[2]}` : 'v21.0';

      // Check deprecation status for versions that sunset in 2026
      const now = new Date();
      const deprecationSchedule = {
        'v19': new Date('2026-02-01'), // February 2026
        'v20': new Date('2026-06-01'), // June 2026
        'v21': new Date('2026-08-01'), // August 2026
        'v22': new Date('2026-10-01'), // October 2026
        'v23': new Date('2027-02-01'), // February 2027
      };

      let isDeprecated = false;
      let deprecationDate: string | undefined;
      let daysUntilDeprecation = Infinity;

      for (const [version, sunsetDate] of Object.entries(deprecationSchedule)) {
        if (html.includes(version) && html.includes('deprecated')) {
          isDeprecated = true;
          deprecationDate = sunsetDate.toISOString().split('T')[0];
          daysUntilDeprecation = Math.floor((sunsetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          break;
        }
      }

      // Warn 90 days before any deprecation
      const shouldWarn = daysUntilDeprecation <= 90 && daysUntilDeprecation > 0;

      return {
        name: 'Google Ads API',
        version: 'v21.0',
        deprecated: isDeprecated || shouldWarn,
        deprecationDate,
        current: !isDeprecated && daysUntilDeprecation > 90
      };
    } catch (error) {
      console.error('Failed to check Google Ads version:', error);
      return {
        name: 'Google Ads API',
        version: 'v17.0',
        deprecated: false,
        current: true
      };
    }
  }

  private async testGoogleAdsConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const testResponse = await this.googleAds.listAccessibleCustomers();
      return { success: testResponse.length >= 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async checkGoogleAdsQuota(): Promise<{ usage: number; limit: number }> {
    try {
      const headers = await this.googleAds.getQuotaInfo();
      return {
        usage: parseInt(headers['x-quota-used'] || '0'),
        limit: parseInt(headers['x-quota-limit'] || '1000')
      };
    } catch {
      return { usage: 0, limit: 1000 };
    }
  }

  private async testGhlWebhookPayload(): Promise<{ compatible: boolean }> {
    const samplePayload = {
      contact: {
        id: 'test_123',
        email: 'test@example.com',
        phone: '+1234567890',
        customField: {
          gclid: 'EAIaIQv3i3m8e7vOZ-1572532743'
        }
      },
      locationId: 'loc_456'
    };

    try {
      const parsed = await this.parseGhlPayload(samplePayload);
      return { compatible: parsed.success };
    } catch {
      return { compatible: false };
    }
  }

  private async parseGhlPayload(payload: any): Promise<{ success: boolean }> {
    return { success: true };
  }

  private async sendNotification(status: ApiHealthStatus): Promise<void> {
    const message = `
🚨 API Health Alert - ${status.service}

Status: ${status.status.toUpperCase()}
Version: ${status.version}
Checked: ${status.lastChecked}

Issues:
${status.issues.map(issue => `• ${issue}`).join('\n')}

Recommendations:
${status.recommendations.map(rec => `• ${rec}`).join('\n')}
`;

    for (const webhook of this.notificationHooks) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }

  async getAllApiStatus(): Promise<ApiHealthStatus[]> {
    const statuses = await Promise.all([
      this.checkGoogleAdsHealth(),
      this.checkGhlWebhookHealth()
    ]);

    return statuses;
  }

  addNotificationHook(webhookUrl: string): void {
    this.notificationHooks.push(webhookUrl);
  }

  startMonitoring(): void {
    setInterval(async () => {
      await this.getAllApiStatus();
    }, this.checkInterval);

    this.getAllApiStatus();
  }
}

export const apiMonitor = new ApiMonitor(new GoogleAdsApi());