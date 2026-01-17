import { GoogleAdsClient } from './google-ads';
import { MetaConversionsAPI } from './meta-conversions';
import { TikTokConversionsAPI } from './tiktok-conversions';

export interface Conversion {
  gclid?: string;
  fbclid?: string;
  conversion_value: number;
  conversion_time: string;
  order_id?: string;
  agency_id: string;
  currency?: string;
}

export class ConversionRouter {
  constructor(private db: D1Database) {}

  async routeConversions(conversions: Conversion[]) {
    const agencyId = conversions[0]?.agency_id;
    if (!agencyId) return { error: 'No agency ID provided' };

    const agency = await this.getAgencyConfig(agencyId);
    if (!agency) return { error: 'Agency not found' };

    // Check if secondary config exists to determine parallel mode
    const hasSecondaryConfig = agency.secondary_google_ads_config &&
                               JSON.parse(agency.secondary_google_ads_config).customerId;
    const mode = hasSecondaryConfig ? 'parallel' : 'single';

    const results: any = {
      primary: null,
      secondary: null,
      mode: mode,
      tiktok: null
    };

    if (mode === 'parallel') {
      const [primaryResult, secondaryResult] = await Promise.allSettled([
        this.uploadToPrimary(conversions, agency),
        this.uploadToSecondary(conversions, agency)
      ]);

      results.primary = primaryResult.status === 'fulfilled' ? primaryResult.value : { error: primaryResult.reason };
      results.secondary = secondaryResult.status === 'fulfilled' ? secondaryResult.value : { error: secondaryResult.reason };
    } else {
      results.primary = await this.uploadToPrimary(conversions, agency);
    }

    return results;
  }

  private async uploadToPrimary(conversions: Conversion[], agency: any) {
    const googleConversions = conversions.filter(c => c.gclid);

    const results: any = {};

    if (googleConversions.length > 0 && agency.google_ads_config) {
      try {
        const config = JSON.parse(agency.google_ads_config);
        const googleClient = new GoogleAdsClient(config);
        results.google_ads = await googleClient.uploadConversions(googleConversions);
      } catch (error) {
        results.google_ads = { error: error.message };
      }
    }

    return results;
  }

  private async uploadToTikTok(conversions: Conversion[], agency: any): Promise<any> {
    const tiktokConversions = conversions.filter(c => c.ttclid);
    
    if (tiktokConversions.length > 0 && agency.tiktok_config) {
      try {
        const config = JSON.parse(agency.tiktok_config);
        const tiktokClient = new TikTokConversionsAPI(config.access_token, config.app_id);
        return await tiktokClient.uploadConversions(tiktokConversions);
      } catch (error) {
        return { error: error.message };
      }
    }
    
    return null;
  }
      try {
        const config = JSON.parse(agency.tiktok_config);
        const tiktokClient = new TikTokConversionsAPI(config.access_token, config.app_id);
        results.tiktok = await tiktokClient.uploadConversions(tiktokConversions);
      } catch (error) {
        results.tiktok = { error: error.message };
      }
    }
    
    return results;
  }

    if (googleConversions.length > 0 && agency.secondary_google_ads_config) {
      try {
        const config = JSON.parse(agency.secondary_google_ads_config);
        const googleClient = new GoogleAdsClient(config);
        return await googleClient.uploadConversions(googleConversions);
      } catch (error) {
        return { error: error.message };
      }
    }

    return null;
  }

  private async getAgencyConfig(agencyId: string) {
    const result = await this.db.prepare('SELECT * FROM agencies WHERE id = ?')
      .bind(agencyId).first();

    return result;
  }

  private async uploadToTikTok(conversions: Conversion[], agency: any): Promise<any> {
    const tiktokConversions = conversions.filter(c => c.ttclid);
    
    if (tiktokConversions.length > 0 && agency.tiktok_config) {
      try {
        const config = JSON.parse(agency.tiktok_config);
        const tiktokClient = new TikTokConversionsAPI(config.access_token, config.app_id);
        return await tiktokClient.uploadConversions(tiktokConversions);
      } catch (error) {
        return { error: error.message };
      }
    }
    
    return null;
  }
}