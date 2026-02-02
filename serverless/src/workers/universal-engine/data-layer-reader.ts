/**
 * DataLayer Reader
 *
 * Safely reads values from nested objects using dot notation
 * Used by Universal Engine to read customer dataLayer using config paths
 */

/**
 * Get value from nested object using dot notation path
 *
 * @param obj - Object to read from (e.g., dataLayer)
 * @param path - Dot notation path (e.g., 'ecommerce.total')
 * @returns Value at path or null if not found
 */
export function getFromDataLayer(obj: any, path: string): any {
  if (!obj || !path) {
    return null;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current == null) {
      return null;
    }

    current = current[key];
  }

  return current;
}

/**
 * Safely read multiple paths and return first valid value
 *
 * @param dataLayer - DataLayer object
 * @param paths - Array of possible paths (fallback order)
 * @returns First found value or null
 */
export function getFirstValidPath(dataLayer: any, paths: string[]): any {
  for (const path of paths) {
    const value = getFromDataLayer(dataLayer, path);
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
}

/**
 * Check if path exists in object
 *
 * @param obj - Object to check
 * @param path - Dot notation path
 * @returns true if path exists and value is not null/undefined
 */
export function pathExists(obj: any, path: string): boolean {
  return getFromDataLayer(obj, path) !== null;
}