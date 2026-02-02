/**
 * Config Generator
 *
 * Generates config.json files from extracted variable mappings.
 * Only generates small mapping files (10-50 lines), NOT complex worker code.
 */

import fs from 'fs';
import { TrackingConfig } from '../schemas/gtm-export';

/**
 * Generate tracking config from macro definitions
 *
 * @param customerId - Customer identifier (e.g., 'customer-001')
 * @param macroDefinitions - Map of variable name → dataLayer path from GTM macros
 * @returns TrackingConfig object
 */
export function generateConfig(
  customerId: string,
  macroDefinitions: Map<string, string>
): TrackingConfig {
  const events: any[] = [];

  // Detect common event patterns from macro definitions
  const eventPatterns = detectEventPatterns(macroDefinitions);

  for (const pattern of eventPatterns) {
    events.push(pattern);
  }

  return {
    customerId,
    containerId: extractContainerId(customerId),
    events,
    version: '1.0.0',
  };
}

/**
 * Detect event patterns from macro definitions
 *
 * Looks for common e-commerce tracking patterns:
 * - Purchase events (order total, currency)
 * - Lead events (email, phone)
 * - View item events (product ID, name)
 */
function detectEventPatterns(macroDefinitions: Map<string, string>): Array<{ eventName: string; platformMappings: Record<string, Record<string, string> | undefined> }> {
  const patterns: Array<{ eventName: string; platformMappings: Record<string, Record<string, string> | undefined> }> = [];

  const valuePath = findDataLayerPath(macroDefinitions, ['purchase value', 'order total', 'revenue']);
  const currencyPath = findDataLayerPath(macroDefinitions, ['currency code', 'currencycode']);
  const emailPath = findDataLayerPath(macroDefinitions, ['email address', 'email', 'emailaddress']);
  const phonePath = findDataLayerPath(macroDefinitions, ['phone number', 'phone', 'phonenumber']);
  const productIdPath = findDataLayerPath(macroDefinitions, ['product id', 'productid', 'item_id']);
  const productNamePath = findDataLayerPath(macroDefinitions, ['product name', 'productname', 'item_name']);

  if (valuePath) {
    patterns.push({
      eventName: 'purchase',
      platformMappings: {
        facebook: { value_path: valuePath, currency_path: currencyPath || 'USD' },
        ga4: { value_path: valuePath, currency_path: currencyPath || 'USD' },
        googleAds: { conversion_value: valuePath },
      },
    });
  }

  if (emailPath || phonePath) {
    patterns.push({
      eventName: 'lead',
      platformMappings: {
        facebook: emailPath || phonePath ? { email_path: emailPath || '', phone_path: phonePath || '' } : undefined,
        ga4: emailPath || phonePath ? { email_path: emailPath || '', phone_path: phonePath || '' } : undefined,
      },
    });
  }

  if (productIdPath || productNamePath) {
    patterns.push({
      eventName: 'view_item',
      platformMappings: {
        facebook: productIdPath ? { item_id_path: productIdPath } : undefined,
        ga4: productIdPath ? { item_id_path: productIdPath, item_name_path: productNamePath } : undefined,
      },
    });
  }

  return patterns;
}

/**
 * Find a dataLayer path by checking macro definition names
 *
 * @param macroDefinitions - Macro variable name → dataLayer path mappings
 * @param candidates - Possible macro names to check
 * @returns dataLayer path or null
 */
function findDataLayerPath(
  macroDefinitions: Map<string, string>,
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    for (const [macroName, dataLayerPath] of macroDefinitions) {
      if (macroName.toLowerCase() === candidate.toLowerCase()) {
        return dataLayerPath;
      }
    }
  }
  return null;
}

/**
 * Extract container ID from customer ID
 * For now, just return as-is until we integrate with GTM API
 */
function extractContainerId(customerId: string): string {
  return customerId;
}

/**
 * Write config to JSON file
 *
 * @param config - TrackingConfig object
 * @param outputPath - File path to write
 */
export function writeConfigToFile(config: TrackingConfig, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');
}