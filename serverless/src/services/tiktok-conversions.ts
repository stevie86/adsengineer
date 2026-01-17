import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { resolveEventTimeSeconds } from '../utils/event-time';

export interface TikTokConversionData {
  ttclid?: string;
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  conversion_value?: number;
  order_id?: string;
  external_id?: string;
  ad_platform?: 'tiktok' | 'unknown';
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
  };
  custom_data?: {
    order_id?: string;
    content_name?: string;
    content_category?: string;
  };
}

export interface TikTokConversionResult {
  success: boolean;
  events_received?: number;
  events_processed?: number;
  errors?: Array<{ code: number; message: string }>;
  job_id?: string;
}

export class TikTokConversionsAPI {
  private accessToken: string;
  private appId: string;
  private apiVersion: string = 'v1.3';

  constructor(accessToken: string, appId: string) {
    this.accessToken = accessToken;
    this.appId = appId;
  }

export class TikTokConversionsAPI {
  private accessToken: string;
  private appId: string;
  private apiVersion: string = 'v1.3';

  constructor(accessToken: string, appId: string) {
    this.accessToken = accessToken;
    this.appId = appId;
  }

export class TikTokConversionsAPI {
  private accessToken: string;
  private appId: string;
  private apiVersion: string = 'v1.3';

  constructor(accessToken: string, appId: string) {
    this.accessToken = accessToken;
    this.appId = appId;
  }

  async uploadConversions(conversions: TikTokConversionData[]): Promise<TikTokConversionResult> {
    const url = `https://business-api.tiktok.com/open_api/v1.3/event/upload/`;
    
    const eventData = conversions.map(conversion => ({
      event_type: conversion.event_name || 'CustomEvent',
      event_time: resolveEventTimeSeconds({ event_time: conversion.event_time }),
      properties: {
        ttclid: conversion.ttclid || null,
        conversion_value: conversion.conversion_value || null,
        currency: conversion.currency || 'USD',
        conversion_value_usd: conversion.conversion_value || null,
        order_id: conversion.order_id || null,
        external_id: conversion.external_id || null,
        user_data: conversion.user_data || {},
        custom_data: conversion.custom_data || {},
        test_event: conversion.event_name?.startsWith('test_') || false,
        ...event.custom_data
      },
      context: {
        ad: {
          callback: conversion.event_time + 86400
        }
      }
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          event_data: {
            batch: [
              ...eventData.map(event => ({
                event: 'CompletePayment',
                event_time: event.event_time || Math.floor(Date.now() / 1000),
                properties: {
                  ttclid: event.ttclid || null,
                  conversion_value: event.conversion_value || null,
                  currency: event.currency || 'USD',
                  conversion_value_usd: event.conversion_value || null,
                  order_id: event.order_id || null,
                  external_id: event.external_id || null,
                  user_data: event.user_data || {},
                  custom_data: event.custom_data || {},
                  test_event: event.event_name?.startsWith('test_') || false,
                  ...event.custom_data
                },
                context: {
                  ad: {
                    callback: conversion.event_time + 86400
                  }
                }
              }
            ]
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok API error: ${response.status} - ${errorData.message}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        events_received: conversions.length,
        events_processed: result.data?.event_response?.received_number_of_events || 0,
        errors: [],
        job_id: `tiktok_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('TikTok conversion upload failed:', error);
      return {
        success: false,
        errors: [{ code: 500, message: error.message }]
      };
    }
  }

  async getEventStatus(jobId: string): Promise<any> {
    const url = `https://business-api.tiktok.com/open_api/v1.3/event/get/`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          job_id: jobId
        })
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TikTok status check failed:', error);
      throw error;
    }
  }
}
      }
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          event_data: {
            batch: [
              ...eventData.map(event => ({
                event: 'CompletePayment',
                event_time: event.event_time || Math.floor(Date.now() / 1000),
                properties: {
                  ttclid: event.ttclid || null,
                  conversion_value: event.conversion_value || null,
                  currency: event.currency || 'USD',
                  conversion_value_usd: event.conversion_value || null,
                  order_id: event.order_id || null,
                  external_id: event.external_id || null,
                  user_data: event.user_data || {},
                  custom_data: event.custom_data || {},
                  test_event: event.event_name?.startsWith('test_') || false,
                  ...event.custom_data
                },
                context: {
                  ad: {
                    callback: event.event_time + 86400
                  }
                }
              }
            ]
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok API error: ${response.status} - ${errorData.message}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        events_received: conversions.length,
        events_processed: result.data?.event_response?.received_number_of_events || 0,
        errors: [],
        job_id: `tiktok_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('TikTok conversion upload failed:', error);
      return {
        success: false,
        errors: [{ code: 500, message: error.message }]
      };
    }
  }

  async getEventStatus(jobId: string): Promise<any> {
    const url = `https://business-api.tiktok.com/open_api/v1.3/event/get/`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          job_id: jobId
        })
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TikTok status check failed:', error);
      throw error;
    }
  }
}
      }
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          event_data: {
            batch: [
              ...eventData.map(event => ({
                event: 'CompletePayment',
                event_time: event.event_time || Math.floor(Date.now() / 1000),
                properties: {
                  ttclid: event.ttclid || null,
                  currency: 'USD',
                  conversion_value_usd: event.conversion_value || null,
                  order_id: event.order_id || null,
                  external_id: event.external_id || null,
                  user_data: event.user_data || {},
                  custom_data: event.custom_data || {},
                  test_event: event.event_name?.startsWith('test_') || false,
                  ...event.custom_data
                },
                context: {
                  ad: {
                    callback: event.event_time + 86400
                  }
                }
              }))
            ]
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TikTok API error: ${response.status} - ${errorData.message}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        events_received: conversions.length,
        events_processed: result.data?.event_response?.received_number_of_events || 0,
        errors: [],
        job_id: `tiktok_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('TikTok conversion upload failed:', error);
      return {
        success: false,
        errors: [{ code: 500, message: error.message }]
      };
    }
  }

  async getEventStatus(jobId: string): Promise<any> {
    const url = `https://business-api.tiktok.com/open_api/v1.3/event/get/`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken
        },
        body: JSON.stringify({
          app_id: this.appId,
          pixel_code: this.appId,
          job_id: jobId
        })
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TikTok status check failed:', error);
      throw error;
    }
  }
}