// src/services/google-ads.ts
// Google Ads REST API service for offline conversion uploads
// Designed for Cloudflare Workers - uses native fetch only

export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string; // For MCC accounts
}

export interface ConversionData {
  gclid?: string;
  conversionActionId: string; // Resource name like "customers/1234567890/conversionActions/987654321"
  conversionValue: number;
  currencyCode?: string;
  conversionTime: string; // Must be formatted as "yyyy-mm-dd hh:mm:ss+|-hh:mm"
  orderId?: string;
}

export interface UploadResult {
  success: boolean;
  conversionAction?: string;
  uploadDateTime?: string;
  errors?: string[];
}

export class GoogleAdsError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GoogleAdsError';
  }
}

/**
 * Get access token using refresh token
 * @param credentials OAuth2 credentials
 * @returns Promise<string> Access token
 */
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new GoogleAdsError(
      `Failed to get access token: ${response.status} ${response.statusText}`,
      'AUTH_ERROR',
      errorData
    );
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Upload offline conversion to Google Ads
 * @param credentials Google Ads API credentials
 * @param conversionData Conversion details
 * @returns Promise<UploadResult>
 */
export async function uploadConversion(
  credentials: GoogleAdsCredentials,
  conversionData: ConversionData
): Promise<UploadResult> {
  try {
    // Get fresh access token
    const accessToken = await getAccessToken(credentials);

    // Construct the click conversion payload
    const clickConversion = {
      conversion_action: conversionData.conversionActionId,
      conversion_date_time: conversionData.conversionTime,
      conversion_value: conversionData.conversionValue,
      currency_code: conversionData.currencyCode || 'USD',
      ...(conversionData.gclid && { gclid: conversionData.gclid }),
      ...(conversionData.orderId && { order_id: conversionData.orderId }),
      // Consent is required for data processing
      consent: {
        ad_user_data: 'GRANTED',
        ad_personalization: 'GRANTED',
      },
    };

    // Make the API call
    const response = await fetch(
      `https://googleads.googleapis.com/v21/customers/${credentials.customerId}:uploadClickConversions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': credentials.developerToken,
          'login-customer-id': credentials.loginCustomerId || credentials.customerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversions: [clickConversion],
          partial_failure: true, // Enable partial failure handling
        }),
      }
    );

    interface GoogleAdsResponse {
      error?: {
        message?: string;
        code?: string;
        status?: string;
        details?: Array<{
          errors?: Array<{
            error_code?: string;
            message?: string;
          }>;
        }>;
      };
      partial_failure_error?: {
        details?: Array<{
          errors?: Array<{
            message?: string;
          }>;
        }>;
      };
      results?: Array<{
        conversion_action?: string;
        upload_date_time?: string;
      }>;
    }

    const responseData = (await response.json()) as GoogleAdsResponse;

    if (!response.ok) {
      const errorObj = responseData.error;
      const errorMessage = errorObj?.message || `HTTP ${response.status}: ${response.statusText}`;
      const errorCode = errorObj?.code || errorObj?.status;

      let userFriendlyMessage = errorMessage;
      if (errorObj?.details && errorObj.details.length > 0) {
        const detail = errorObj.details[0];
        if (detail.errors && detail.errors.length > 0) {
          const apiError = detail.errors[0];
          switch (apiError.error_code) {
            case 'CONVERSION_UPLOAD_ERROR':
              if (apiError.message?.includes('too old')) {
                userFriendlyMessage = 'Conversion is too old (must be within 90 days)';
              } else if (apiError.message?.includes('gclid')) {
                userFriendlyMessage = 'Invalid or missing GCLID';
              }
              break;
            case 'AUTHENTICATION_ERROR':
              userFriendlyMessage = 'Authentication failed - check credentials';
              break;
            case 'PERMISSION_DENIED':
              userFriendlyMessage = 'Insufficient permissions for this account';
              break;
          }
        }
      }

      throw new GoogleAdsError(userFriendlyMessage, errorCode, errorObj);
    }

    // Handle partial failures
    const hasPartialFailure = responseData.partial_failure_error;

    if (hasPartialFailure) {
      const errors: string[] = [];
      if (hasPartialFailure.details && hasPartialFailure.details.length > 0) {
        for (const detail of hasPartialFailure.details) {
          if (detail.errors) {
            for (const error of detail.errors) {
              errors.push(error.message || 'Unknown partial failure error');
            }
          }
        }
      }

      return {
        success: false,
        errors,
      };
    }

    // Success case
    const result = responseData.results?.[0];
    return {
      success: true,
      conversionAction: result?.conversion_action,
      uploadDateTime: result?.upload_date_time,
    };
  } catch (error) {
    if (error instanceof GoogleAdsError) {
      throw error;
    }

    // Handle network or other unexpected errors
    throw new GoogleAdsError(
      `Unexpected error during conversion upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Format conversion time according to Google Ads requirements
 * @param date Date to format
 * @param timezoneOffset Optional timezone offset in minutes (default: local timezone)
 * @returns Formatted string: "yyyy-mm-dd hh:mm:ss+|-hh:mm"
 */
export function formatConversionTime(date: Date, timezoneOffset?: number): string {
  // Use provided timezone offset or get from date
  const offset = timezoneOffset !== undefined ? timezoneOffset : date.getTimezoneOffset();

  // Calculate offset hours and minutes
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;

  // Format offset string
  const offsetSign = offset <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

  // Format date components
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${offsetString}`;
}

/**
 * Validate conversion time format
 * @param timeString Time string to validate
 * @returns boolean
 */
export function isValidConversionTime(timeString: string): boolean {
  // Google Ads format: yyyy-mm-dd hh:mm:ss+|-hh:mm
  const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
  return pattern.test(timeString);
}
