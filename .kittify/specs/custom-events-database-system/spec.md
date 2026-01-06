# Custom Events Database System Specification

## Overview
Create a comprehensive database system for configurable custom events tracking that allows organizations to define, configure, and assign custom events to their sites with support for multiple assignments of the same event with different configurations. The system supports Shopify, WooCommerce, and custom platforms with flexible trigger conditions, threshold settings, and Google Ads conversion mapping.

## Business Context
AdsEngineer needs to support advanced custom event tracking beyond basic purchase events to enable sophisticated attribution and optimization strategies. Organizations require the ability to define custom business events (subscription starts, customer segments, high-value transactions, intent signals) and configure them differently across sites and platforms.

Key business needs:
- Define custom events that align with business goals and optimization strategies
- Support multiple platforms (Shopify, WooCommerce, custom sites)
- Allow flexible configuration and thresholds for different use cases
- Enable multiple assignments of the same event with different settings
- Maintain Google Ads conversion mapping for accurate attribution

## Functional Requirements

### Custom Event Definitions Management
- **FR-CED-001**: Organizations can create custom event definitions with name, description, trigger type, and conditions
- **FR-CED-002**: Support multiple trigger types: webhook, frontend, API, manual
- **FR-CED-003**: Define platform-specific trigger conditions and validation rules
- **FR-CED-004**: Configure Google Ads conversion actions and categories for each event
- **FR-CED-005**: Set strategic value descriptions and priority levels
- **FR-CED-006**: Support system default events that all organizations can use
- **FR-CED-007**: Organizations can override and extend system defaults

### Site Assignment Management
- **FR-CED-008**: Assign custom events to specific sites with configurable settings
- **FR-CED-009**: Support multiple assignments of the same event to the same site with different configurations
- **FR-CED-010**: Override trigger conditions, thresholds, and conversion actions per assignment
- **FR-CED-011**: Enable/disable assignments independently
- **FR-CED-012**: Track assignment metadata (created, updated, assignment names/descriptions)

### Platform Support
- **FR-CED-013**: Support Shopify webhooks with signature validation
- **FR-CED-014**: Support WooCommerce hooks and filters
- **FR-CED-015**: Support custom platform API integration
- **FR-CED-016**: Handle platform-specific data structures and event formats

### Configuration Flexibility
- **FR-CED-017**: Define custom thresholds (value, AOV multiplier, time windows)
- **FR-CED-018**: Configure platform-specific conditions and validation
- **FR-CED-019**: Support JSON-based configuration for complex rules
- **FR-CED-020**: Allow assignment-specific overrides of all settings

## Non-Functional Requirements

### Performance
- **NFR-CED-001**: Event processing completes within 100ms for webhook events
- **NFR-CED-002**: Database queries support up to 1000 concurrent event assignments
- **NFR-CED-003**: Configuration loading cached for optimal performance

### Security
- **NFR-CED-004**: Platform webhook signatures validated before processing
- **NFR-CED-005**: Organization data isolation enforced at database level
- **NFR-CED-006**: Configuration changes logged for audit trail

### Scalability
- **NFR-CED-007**: Support unlimited custom events per organization
- **NFR-CED-008**: Handle multiple assignments per event without performance degradation
- **NFR-CED-009**: Platform integrations scale to support enterprise deployments

## User Scenarios

### Scenario 1: Define High-Value Transaction Event
**Given** an organization wants to track purchases over €150
**When** they create a "high_value_transaction" event
**Then** they can set different thresholds for different sites (€150 for site A, €200 for site B)
**And** each assignment maps to different Google Ads conversion actions

### Scenario 2: Multiple Subscription Events
**Given** an organization sells different subscription types
**When** they assign "subscription_start" multiple times with different conditions
**Then** each assignment tracks different subscription products
**And** each maps to specific conversion actions for attribution

### Scenario 3: Platform-Specific Configuration
**Given** an organization uses both Shopify and WooCommerce
**When** they configure events for both platforms
**Then** platform-specific conditions are applied automatically
**And** data is normalized for consistent processing

## Success Criteria

### Functional Completeness
- All CRUD operations for event definitions and assignments work correctly
- Multiple assignments of the same event are supported without conflicts
- Platform-specific processing works for Shopify, WooCommerce, and custom platforms
- Google Ads conversion mapping functions properly

### Performance Targets
- Event processing latency under 100ms for 95% of requests
- Database queries complete within 50ms for configuration loading
- System supports 1000+ concurrent event assignments

### Data Integrity
- No data loss during event processing
- Configuration changes don't break existing assignments
- Platform webhook validation prevents unauthorized data

## Key Entities

### CustomEventDefinition
- id: Primary key
- org_id: Organization identifier
- event_name: Unique event identifier
- display_name: Human-readable name
- description: Event purpose and behavior
- trigger_type: 'webhook' | 'frontend' | 'api' | 'manual'
- trigger_conditions: JSON object with platform-specific conditions
- supported_platforms: Array of supported platforms
- google_ads_conversion_action: Google Ads conversion action name
- google_ads_category: Google Ads conversion category
- strategic_value: Business value description
- priority: Display and processing priority
- is_active: Enable/disable flag
- created_at/updated_at: Audit timestamps

### SiteCustomEvent
- id: Primary key
- org_id: Organization identifier
- site_id: Site identifier
- event_definition_id: Reference to event definition
- assignment_name: Optional name for this assignment
- assignment_description: Optional description
- is_enabled: Enable/disable this assignment
- custom_conditions: JSON overrides for trigger conditions
- custom_conversion_action: Override conversion action
- thresholds: JSON object with custom thresholds
- created_at/updated_at: Audit timestamps

### CustomEvent
- id: Primary key
- org_id: Organization identifier
- event_definition_id: Reference to definition
- site_id: Site identifier
- platform: Platform that triggered the event
- event_data: JSON object with event-specific data
- gclid/fbclid: Click identifiers
- utm_parameters: Marketing attribution
- processed_at: When event was processed
- created_at: When event occurred

## Assumptions

1. Organizations will have reasonable limits on custom events (under 100 per org)
2. Most events will be platform-native (Shopify/WooCommerce) rather than fully custom
3. Google Ads conversion actions will be pre-configured in the Google Ads account
4. Event processing will be primarily asynchronous to handle high volumes
5. Configuration changes will be rare and can be cached aggressively

## Dependencies

- D1 Database for configuration and event storage
- Google Ads API for conversion upload
- Platform webhook endpoints (Shopify, WooCommerce)
- Organization management system for data isolation