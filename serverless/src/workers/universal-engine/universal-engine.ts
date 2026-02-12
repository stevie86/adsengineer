/**
 * Universal Engine - Main Worker Class
 *
 * Handles event processing for all customers using a single codebase.
 * Loads customer-specific configs at runtime and sends events to platforms.
 */

import { getFromDataLayer } from './data-layer-reader';

export interface EventConfig {
  eventName: string;
  platformMappings: {
    facebook?: Record<string, string>;
    ga4?: Record<string, string>;
    googleAds?: Record<string, string>;
  };
}

export interface CustomerConfig {
  customerId: string;
  containerId: string;
  events: EventConfig[];
  version: string;
}

export interface EventData {
  eventName: string;
  dataLayer: any;
}

export class UniversalEngine {
  private env: Bindings;

  constructor(env: Bindings) {
    this.env = env;
  }

  /**
   * Process incoming event
   *
   * @param customerId - Customer identifier
   * @param eventData - Event data with eventName and dataLayer
   * @returns Processing result
   */
  async processEvent(customerId: string, eventData: EventData): Promise<Record<string, any>> {
    const config = await this.loadCustomerConfig(customerId);

    if (!config) {
      throw new Error(`No config found for customer: ${customerId}`);
    }

    const eventConfig = config.events.find((e) => e.eventName === eventData.eventName);

    if (!eventConfig) {
      throw new Error(`No config found for event: ${eventData.eventName}`);
    }

    const results: Record<string, any> = {};

    if (eventConfig.platformMappings.facebook) {
      results.facebook = await this.sendFacebookEvent(
        eventData,
        eventConfig.platformMappings.facebook
      );
    }

    if (eventConfig.platformMappings.ga4) {
      results.ga4 = await this.sendGA4Event(eventData, eventConfig.platformMappings.ga4);
    }

    if (eventConfig.platformMappings.googleAds) {
      results.googleAds = await this.sendGoogleAdsEvent(
        eventData,
        eventConfig.platformMappings.googleAds
      );
    }

    await this.logEventSuccess(customerId, eventData.eventName, results);

    return results;
  }

  /**
   * Load customer-specific config
   *
   * @param customerId - Customer identifier
   * @returns Customer config or null
   */
  private async loadCustomerConfig(customerId: string): Promise<CustomerConfig | null> {
    try {
      const configKey = `config:${customerId}`;
      const configJson = await this.env.KV.get(configKey);

      if (!configJson) {
        return null;
      }

      return JSON.parse(configJson) as CustomerConfig;
    } catch (error) {
      console.error(`Failed to load config for ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Send event to Facebook CAPI
   *
   * @param eventData - Event data
   * @param facebookMapping - Facebook platform mappings
   * @returns Facebook API response
   */
  private async sendFacebookEvent(
    eventData: EventData,
    facebookMapping: Record<string, string>
  ): Promise<any> {
    const { dataLayer, eventName } = eventData;

    const payload: any = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
    };

    for (const [field, path] of Object.entries(facebookMapping)) {
      const value = getFromDataLayer(dataLayer, path);
      if (value !== null) {
        payload[field] = value;
      }
    }

    console.log('Facebook CAPI payload:', JSON.stringify(payload, null, 2));

    return {
      success: true,
      message: 'Facebook CAPI event sent',
      payload,
    };
  }

  /**
   * Send event to GA4 Measurement Protocol
   *
   * @param eventData - Event data
   * @param ga4Mapping - GA4 platform mappings
   * @returns GA4 API response
   */
  private async sendGA4Event(
    eventData: EventData,
    ga4Mapping: Record<string, string>
  ): Promise<any> {
    const { dataLayer, eventName } = eventData;

    const params: Record<string, any> = {};

    for (const [field, path] of Object.entries(ga4Mapping)) {
      const value = getFromDataLayer(dataLayer, path);
      if (value !== null) {
        params[field] = value;
      }
    }

    console.log('GA4 event payload:', JSON.stringify({ event_name: eventName, params }, null, 2));

    return {
      success: true,
      message: 'GA4 event sent',
      eventName,
      params,
    };
  }

  /**
   * Send event to Google Ads
   *
   * @param eventData - Event data
   * @param googleAdsMapping - Google Ads platform mappings
   * @returns Google Ads API response
   */
  private async sendGoogleAdsEvent(
    eventData: EventData,
    googleAdsMapping: Record<string, string>
  ): Promise<any> {
    const { dataLayer, eventName } = eventData;

    const payload: any = {};

    for (const [field, path] of Object.entries(googleAdsMapping)) {
      const value = getFromDataLayer(dataLayer, path);
      if (value !== null) {
        payload[field] = value;
      }
    }

    console.log('Google Ads event payload:', JSON.stringify({ eventName, payload }, null, 2));

    return {
      success: true,
      message: 'Google Ads conversion sent',
      eventName,
      payload,
    };
  }

  /**
   * Log successful event processing
   *
   * @param customerId - Customer ID
   * @param eventName - Event name
   * @param results - Processing results
   */
  private async logEventSuccess(
    customerId: string,
    eventName: string,
    results: Record<string, any>
  ): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO event_logs (customer_id, event_name, platforms_sent, sent_at)
        VALUES (?, ?, ?, ?)
      `)
        .bind(customerId, eventName, JSON.stringify(Object.keys(results)), new Date().toISOString())
        .run();
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }
}
