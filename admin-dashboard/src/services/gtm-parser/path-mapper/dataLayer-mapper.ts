/**
 * DataLayer Path Mapper
 *
 * Converts GTM variable names to dataLayer path notation.
 * Handles common GTM variable naming conventions.
 */

/**
 * GTM variable naming patterns to dataLayer paths
 *
 * Example mappings:
 * - Ecommerce.total → ecommerce.total
 * - User.Email → user.email
 * - Purchase Value → no mapping (custom variable)
 */
export function variableToDataLayerPath(gtmVariable: string): string | null {
  const variable = gtmVariable.trim();

  // Pattern 1: Dot notation (e.g., Ecommerce.total → ecommerce.total)
  if (variable.includes('.')) {
    return variable.toLowerCase().replace(/\s+/g, '');
  }

  // Pattern 2: camelCase (e.g., ecommerceTotal → ecommerce.total)
  if (isCamelCase(variable)) {
    return camelCaseToPath(variable);
  }

  // Pattern 3: Spaces (e.g., "Purchase Value" → no automated mapping)
  if (variable.includes(' ')) {
    return null;
  }

  // Pattern 4: Known dataLayer variables prefix
  const knownPrefixes = ['event', 'page', 'ecommerce', 'user', 'google_tag_params', 'enhanced ecommerce data'];
  for (const prefix of knownPrefixes) {
    if (variable.toLowerCase().startsWith(prefix.toLowerCase())) {
      return variable.toLowerCase();
    }
  }

  // Unknown variable - requires manual mapping
  return null;
}

/**
 * Check if string is camelCase
 */
function isCamelCase(str: string): boolean {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str) && str !== str.toLowerCase();
}

/**
 * Convert camelCase to dot path
 * Example: ecommerceTotal → ecommerce.total
 */
function camelCaseToPath(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, '.$1')
    .toLowerCase()
    .replace(/^[.]/, '');
}

/**
 * Get all dataLayer paths for a set of variables
 *
 * @param variables - Array of GTM variable names
 * @returns Map of variable → dataLayer path (null if no mapping)
 */
export function mapVariablesToDataLayer(variables: string[]): Map<string, string | null> {
  const mapping = new Map<string, string | null>();

  for (const variable of variables) {
    const path = variableToDataLayerPath(variable);
    mapping.set(variable, path);
  }

  return mapping;
}