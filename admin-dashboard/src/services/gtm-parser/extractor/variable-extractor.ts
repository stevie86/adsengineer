/**
 * Variable Extractor
 *
 * Finds {{variable}} patterns in GTM export tags and extracts variable names.
 * Also extracts macro variable definitions with their dataLayer paths.
 */

import { VARIABLE_PATTERN } from '../schemas/gtm-export';

/**
 * Extract all {{variable}} references from GTM tag parameters
 *
 * @param tag - GTM tag object from export
 * @returns Array of variable names (without {{}} brackets)
 */
export function extractVariables(tag: any): string[] {
  const variables = new Set<string>();

  if (tag.parameter) {
    for (const param of tag.parameter) {
      const value = param.value;

      if (typeof value === 'string') {
        extractStringVariables(value, variables);
      } else if (typeof value === 'object') {
        extractObjectVariables(value, variables);
      } else if (Array.isArray(value)) {
        extractArrayVariables(value, variables);
      }
    }
  }

  return Array.from(variables);
}

/**
 * Extract macro variable definitions from GTM export
 *
 * @param macros - Macro array from GTM export
 * @returns Map of variable name → dataLayer path
 */
export function extractMacroDefinitions(macros: any[]): Map<string, string> {
  const definitions = new Map<string, string>();

  if (!Array.isArray(macros)) {
    return definitions;
  }

  for (const macro of macros) {
    if (macro.name && macro.parameter) {
      const dataLayerPath = extractDataLayerPathFromMacro(macro);
      if (dataLayerPath) {
        definitions.set(macro.name, dataLayerPath);
      }
    }
  }

  return definitions;
}

/**
 * Extract dataLayer path from GTM macro definition
 *
 * @param macro - GTM macro object
 * @returns dataLayer path string
 */
function extractDataLayerPathFromMacro(macro: any): string | null {
  if (!macro.parameter || !Array.isArray(macro.parameter)) {
    return null;
  }

  for (const param of macro.parameter) {
    if (param.key === 'dataLayerVariable' && param.value) {
      return param.value;
    }
  }

  return null;
}

/**
 * Extract {{variable}} patterns from string values
 */
function extractStringVariables(str: string, variables: Set<string>) {
  const matches = str.matchAll(VARIABLE_PATTERN);

  for (const match of matches) {
    const varName = match[1].trim();
    if (varName) {
      variables.add(varName);
    }
  }
}

/**
 * Extract {{variable}} patterns from nested objects
 */
function extractObjectVariables(obj: any, variables: Set<string>) {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      extractStringVariables(value, variables);
    } else if (typeof value === 'object' && value !== null) {
      extractObjectVariables(value, variables);
    } else if (Array.isArray(value)) {
      extractArrayVariables(value, variables);
    }
  }
}

/**
 * Extract {{variable}} patterns from nested arrays
 */
function extractArrayVariables(arr: any[], variables: Set<string>) {
  for (const item of arr) {
    if (typeof item === 'string') {
      extractStringVariables(item, variables);
    } else if (typeof item === 'object' && item !== null) {
      extractObjectVariables(item, variables);
    } else if (Array.isArray(item)) {
      extractArrayVariables(item, variables);
    }
  }
}