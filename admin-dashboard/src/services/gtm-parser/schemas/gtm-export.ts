/**
 * GTM Export Schema Definitions
 *
 * Validates Google Tag Manager container export JSON format.
 * Used to ensure we can parse customer GTM exports correctly.
 */

import { z } from 'zod';

// Variable reference patterns (e.g., {{Purchase Value}}, {{ECOMMERCE.total}})
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * GTM Variable Type Schema
 */
const GTMVariableType = z.object({
  accountId: z.string(),
  containerId: z.string(),
  variableId: z.string(),
  name: z.string(),
  type: z.string(), // CONSTANT, GTM_VARIABLE, etc.
  parameter: z.array(z.object({
    key: z.string(),
    value: z.any(),
    type: z.string().optional(),
    list: z.any().optional(),
 })).optional(),
});

/**
 * GTM Tag Schema
 */
const GTMTag = z.object({
  accountId: z.string(),
  containerId: z.string(),
  tagId: z.string(),
  name: z.string(),
  type: z.string(), // ua, gaaw, html, etc.
  parameter: z.array(z.object({
    key: z.string(),
    value: z.any(),
    type: z.string().optional(),
    list: z.any().optional(),
  })).optional(),
  priority: z.object({
    type: z.string(),
    value: z.number(),
  }).optional(),
  firingRuleId: z.array(z.string()).optional(),
});

/**
 * GTM Trigger Schema
 */
const GTMTrigger = z.object({
  accountId: z.string(),
  containerId: z.string(),
  triggerId: z.string(),
  name: z.string(),
  type: z.string(), // page_view, click, etc.
filter: z.array(z.object({
      type: z.string(),
      parameter: z.array(z.object({
        key: z.string(),
        value: z.custom<unknown>(),
      })),
  })).optional(),
});

/**
 * GTM Container Export Schema
 */
const GTMContainerExport = z.object({
  containerVersion: z.string().optional(),
  container: z.object({
    accountId: z.string(),
    containerId: z.string(),
    name: z.string(),
  }),
  containerVersionId: z.string().optional(),
  containerType: z.string().optional(),
  accountPath: z.string().optional(),
  containerPath: z.string().optional(),
  macro: z.union([z.array(GTMVariableType), z.object()]).optional(),
  tag: z.union([z.array(GTMTag), z.object()]).optional(),
  trigger: z.union([z.array(GTMTrigger), z.object()]).optional(),
});

/**
 * Variable Mapping Schema
 * Output of GTM parser - maps event types to dataLayer paths
 */
const VariableMapping = z.object({
  eventName: z.string(),
  platformMappings: z.object({
    facebook: z.record(z.string()).optional(), // event → {value_path, currency_path, etc.}
    ga4: z.record(z.string()).optional(),
    googleAds: z.record(z.string()).optional(),
  }),
});

/**
 * Config JSON Schema
 * Final output - customer-specific tracking config
 */
const TrackingConfig = z.object({
  customerId: z.string(),
  containerId: z.string(),
  events: z.array(VariableMapping),
  version: z.string(),
});

// Export types
export type GTMVariableType = z.infer<typeof GTMVariableType>;
export type GTMTag = z.infer<typeof GTMTag>;
export type GTMTrigger = z.infer<typeof GTMTrigger>;
export type GTMContainerExport = z.infer<typeof GTMContainerExport>;
export type VariableMapping = z.infer<typeof VariableMapping>;
export type TrackingConfig = z.infer<typeof TrackingConfig>;

// Export schemas
export { GTMContainerExport, VariableMapping, TrackingConfig, VARIABLE_PATTERN };