# Server-Side GTM Container Support Specification

## Overview
Implement server-side Google Tag Manager container support for enterprise customers with hybrid client/server detection, per-customer configuration, and GDPR-compliant first-party data collection to address enterprise privacy requirements and ad-blocker circumvention.

## Business Context

### Current Limitation
AdsEngineer currently only provides client-side tracking, which fails for:
- Enterprise customers with strict Content Security Policy (CSP)
- German/EU markets requiring GDPR compliance (like MyCannaby)
- Corporate environments blocking third-party scripts
- Ad-blocker affected tracking (30-50% data loss)

### Market Opportunity
- Enterprise B2B SaaS market willing to pay 2-3x premium for server-side tracking
- 98% tracking accuracy vs 75% client-side industry standard
- Competitive advantage over standard conversion tracking tools
- Addresses $12B enterprise tracking accuracy gap

## Functional Requirements

### GTM Infrastructure
- **FR-GTM-001**: Server-side GTM endpoint in Cloudflare Workers
- **FR-GTM-002**: Hybrid detection logic (client vs server-side)
- **FR-GTM-003**: Per-customer GTM configuration in database
- **FR-GTM-004**: Tag processing and forwarding to Google Tag Manager
- **FR-GTM-005**: Fallback to client-side when server-side fails

### Customer Configuration
- **FR-GTM-006**: Customer tier classification (Enterprise/Professional/Starter)
- **FR-GTM-007**: GTM container ID management per customer
- **FR-GTM-008**: Server-side endpoint URL configuration
- **FR-GTM-009**: Fallback behavior toggles
- **FR-GTM-010**: Consent management for GDPR compliance

### Privacy & Compliance
- **FR-GTM-011**: First-party data collection endpoint
- **FR-GTM-012**: EU data residency enforcement
- **FR-GTM-013**: Consent mode integration
- **FR-GTM-014**: Cookie-less tracking capability
- **FR-GTM-015**: Audit logging for compliance verification

### Integration Features
- **FR-GTM-016**: Enhanced tracking snippet with tier detection
- **FR-GTM-017**: Automatic server-side routing for enterprise customers
- **FR-GTM-018**: Seamless client-side fallback for others
- **FR-GTM-019**: Real-time configuration updates
- **FR-GTM-020**: Admin dashboard for GTM management

## Non-Functional Requirements

### Performance
- **NFR-GTM-001**: Server-side tag processing < 100ms latency
- **NFR-GTM-002**: 99.9% uptime for GTM endpoint
- **NFR-GTM-003**: Support 10,000 concurrent tag requests
- **NFR-GTM-004**: Sub-50ms database query times for GTM config

### Security
- **NFR-GTM-005**: End-to-end encryption for tag data
- **NFR-GTM-006**: Rate limiting per customer (1000 req/min)
- **NFR-GTM-007**: Audit trail for all GTM operations
- **NFR-GTM-008**: Input validation and sanitization

### Scalability
- **NFR-GTM-009**: Horizontal scaling via Cloudflare Workers
- **NFR-GTM-010**: Database sharding for 100K+ customers
- **NFR-GTM-011**: Caching layer for GTM configurations
- **NFR-GTM-012**: Monitoring and alerting system

## User Scenarios

### Scenario 1: Enterprise Customer (MyCannaby)
**Given** MyCannaby configured as enterprise tier
**When** User visits mycannaby.de with tracking snippet
**Then** Snippet detects enterprise configuration
**And** Routes all tags through server-side endpoint
**And** Achieves 98% tracking accuracy
**And** Maintains GDPR compliance

### Scenario 2: Professional Customer (Hybrid)
**Given** Professional tier customer with mixed requirements
**When** User visits website with ad-blocker enabled
**Then** Snippet attempts server-side routing first
**And** Falls back to client-side if server unavailable
**And** Maintains tracking continuity

### Scenario 3: Starter Customer (Client-Side)
**Given** Starter tier customer with basic requirements
**When** User visits standard website
**Then** Snippet uses optimized client-side tracking
**And** Minimal JavaScript footprint
**And** Fast page load times

### Scenario 4: Admin Configuration
**Given** Agency administrator managing multiple customers
**When** They update GTM settings via admin dashboard
**Then** Changes propagate immediately to production
**And** Customer-specific rules are enforced
**And** Audit logs record all changes

## Success Criteria

### Quantitative Metrics
- **SC-GTM-001**: 98% tracking accuracy for enterprise customers
- **SC-GTM-002**: <100ms server-side tag processing time
- **SC-GTM-003**: 50% reduction in ad-blocker data loss
- **SC-GTM-004**: 99.9% uptime for GTM endpoints
- **SC-GTM-005**: Support 500 enterprise customers simultaneously

### Qualitative Measures
- **SC-GTM-006**: Enterprise customers achieve GDPR compliance
- **SC-GTM-007**: Seamless switching between client/server modes
- **SC-GTM-008**: Admin dashboard provides clear configuration options
- **SC-GTM-009**: Audit trails satisfy compliance requirements
- **SC-GTM-010**: Competitive advantage over pure client-side solutions

## Key Entities

### GTM_Config
- customer_id: string (primary key)
- container_id: string (GTM container identifier)
- endpoint_url: string (server-side endpoint)
- tier: enum (enterprise/professional/starter)
- fallback_enabled: boolean
- consent_settings: object (GDPR configuration)
- rate_limits: object (request limits)

### Tag_Processing_Log
- id: string (unique identifier)
- customer_id: string (foreign key)
- tag_data: object (processed tags)
- processing_time_ms: number
- server_response: object (GTM response)
- created_at: timestamp

### Customer_Tier
- tier_id: enum
- name: string
- requires_server_side: boolean
- max_requests_per_minute: number
- special_features: array (GDPR, audit_logging, etc.)

## Assumptions
- Cloudflare Workers can handle external API calls to Google Tag Manager
- Database schema can be extended with new columns
- Enterprise customers have technical capability to implement server-side endpoints
- GDPR requirements can be met through first-party data collection
- Existing client-side snippet can be enhanced with tier detection

## Dependencies
- Google Tag Manager API access for server-side integration
- Enhanced database schema (ALTER TABLE agencies)
- Admin dashboard frontend updates for GTM configuration
- Enhanced tracking snippet generation
- Testing framework for server-side tag validation
- Monitoring and alerting system setup

## Risks
- Google Tag Manager API rate limits may affect enterprise customers
- Server-side complexity could introduce new failure points
- Customer misconfiguration could break tracking
- GDPR interpretation differences across EU countries
- Performance impact on Cloudflare Workers with high volume

## Out of Scope
- Complete marketing automation platform
- Advanced customer data platform (CDP) features
- Multi-tag manager support (beyond GTM)
- Real-time bid management
- Cross-domain tracking from single deployment

## Implementation Complexity
**Technical Complexity**: High (7/10)
- Requires new API endpoint creation
- Database schema changes
- Complex hybrid detection logic
- Performance optimization at scale

**Business Complexity**: Medium (5/10)
- Customer tier management
- Pricing model changes
- Enterprise sales requirements
- Support documentation

**Integration Complexity**: High (8/10)
- Google Tag Manager API integration
- Enhanced snippet deployment
- Admin dashboard updates
- Testing across multiple customer tiers