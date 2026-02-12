/**
 * General Adapter
 *
 * Pass-through adapter for custom clients.
 * Expects data already in StandardEvent format.
 */

import type { AdapterResult, StandardEvent } from '../types';

/**
 * Convert general payload to StandardEvent
 *
 * For custom clients who format data correctly upfront.
 * Validates the input is a valid StandardEvent.
 *
 * @param payload - StandardEvent object
 * @returns AdapterResult with the same StandardEvent
 */
export function generalAdapter(payload: StandardEvent): AdapterResult<StandardEvent> {
  try {
    const standardEvent: StandardEvent = {
      eventName: payload.eventName,
      userData: payload.userData || {},
      customData: payload.customData || {},
      timestamp: payload.timestamp || Date.now(),
    };

    return {
      success: true,
      event: standardEvent,
      originalRequest: payload,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      originalRequest: payload,
    };
  }
}
