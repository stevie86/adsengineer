/**
 * Facebook CAPI Service
 *
 * Sends StandardEvents to Facebook Conversions API.
 * Currently mocks the CAPI call for Phase 1.
 */

import type { StandardEvent } from '../types';

/**
 * Send event to Facebook CAPI
 *
 * Mock implementation for Phase 1.
 * Logs the StandardEvent JSON to stdout.
 *
 * @param event - StandardEvent to send
 * @returns Simulated CAPI response
 */
export async function sendToFacebookCAPI(event: StandardEvent): Promise<{
  success: boolean;
  message: string;
  sentAt: Date;
}> {
  const capiPayload = {
    event_name: event.eventName,
    event_time: Math.floor((event.timestamp || Date.now()) / 1000),
    event_source_url: '',
    user_data: event.userData,
    custom_data: event.customData,
  };

  console.log('Sending to FB:', JSON.stringify(capiPayload, null, 2));

  return {
    success: true,
    message: 'Mock CAPI send successful',
    sentAt: new Date(),
  };
}
