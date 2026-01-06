---
work_package_id: WP01
subtasks: ["T001", "T002", "T003", "T004", "T005", "T006"]
lane: planned
assignee: claude
agent: claude
shell_pid: 45678
history:
  - "2026-01-05T11:45:00Z – claude – shell_pid=45678 – lane=planned – Created work package"
---

# WP01: Shopify Webhook Enhancement

## Objective

Enhance Shopify webhook processing to extract product-level details and categorize CBD products for targeted Google Ads optimization.

## Context

Current system processes orders with total amounts but lacks product intelligence. Marketing needs category-specific data (oils vs edibles vs topicals) and individual product performance insights to optimize Google Ads campaigns effectively.

## Implementation Sketch

### Product Data Extraction
- Extract line items from Shopify order payload
- Parse product IDs, titles, quantities, SKUs, prices
- Store structured product data in database

### CBD Product Categorization
- Implement title-based categorization rules
- Add SKU pattern matching for specific products
- Create configurable category mappings
- Handle unknown products with fallback categories

### Enhanced Order Processing
- Extend current order processing with product details
- Add high-value order detection (>€100)
- Implement subscription vs one-time purchase tracking
- Maintain backward compatibility with existing webhook processing

## Tasks

### T001: Extract Line Items from Shopify Order
Update the `processOrder()` function to parse `line_items` array and extract individual product details including product ID, title, quantity, unit price, and SKU.

**Acceptance Criteria**: All line items from test orders are correctly extracted with 100% accuracy for required fields.

### T002: Implement CBD Product Categorization
Create a categorization engine that automatically classifies CBD products into categories: oils, edibles, topicals, flower, accessories based on product titles, SKUs, and vendor information.

**Acceptance Criteria**: 95%+ of known CBD products are correctly categorized using title/SKU patterns.

### T003: Enhance Order Data Structure
Extend the order processing to include structured product details, categories, and flags for high-value orders and subscription items.

**Acceptance Criteria**: Enhanced order data structure includes all required fields and passes validation without breaking existing functionality.

### T004: Update Webhook Processing with Multi-Product Support
Modify the Shopify webhook handler to process orders with multiple products efficiently, handling bulk processing scenarios and edge cases.

**Acceptance Criteria**: Orders with 10+ products process successfully without performance degradation (<2 second response time).

### T005: Add High-Value Order Detection
Implement logic to identify orders exceeding €100 total value and flag them as premium conversions for Google Ads.

**Acceptance Criteria**: All orders >€100 are correctly flagged as high-value; orders <€100 are not flagged.

### T006: Implement Subscription vs One-Time Purchase Detection
Add logic to distinguish between subscription purchases and one-time orders, tracking recurring revenue differently for LTV calculations.

**Acceptance Criteria**: Subscription items are correctly identified and flagged; one-time purchases are not flagged as subscriptions.

## Technical Context

### Files to Modify
- `serverless/src/routes/shopify.ts` - Main webhook processing
- `serverless/src/types.ts` - Add enhanced type definitions
- Database migration script for new schema fields

### Current Infrastructure
- Shopify webhooks: `/api/v1/shopify/webhook` (existing)
- Database: Cloudflare D1 (existing)
- Google Ads integration: Existing API, enhance with multiple actions

### Dependencies
- Must not break existing order processing flow
- Must maintain current GCLID extraction and hashing
- Must preserve existing webhook signature validation

## Review Guidance

Focus on clean, maintainable code that extends existing patterns without breaking current functionality. Test extensively with multi-product orders and edge cases before production deployment.