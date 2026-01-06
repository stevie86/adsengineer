# Enhanced Purchase Tracking Specification

## Overview

**Feature**: Enhanced Shopify Purchase Tracking with Product-Level Details  
**Target**: mycannaby.de CBD e-commerce store  
**Problem**: Current system only tracks total order amounts, missing critical product intelligence for Google Ads optimization

---

## User Stories & Scenarios

### Primary Users
1. **Marketing Manager** - Needs product performance data for campaign optimization
2. **Campaign Specialist** - Requires category-specific conversion metrics  
3. **Business Owner** - Wants insight into customer purchase behavior

### Key Scenarios

#### Scenario 1: Multi-Product Order
**When**: Customer purchases CBD oil + gummies  
**Then**: System tracks both product categories separately in Google Ads  
**So**: Marketing can optimize bids for each product category

#### Scenario 2: High-Value Purchase  
**When**: Order total exceeds €100  
**Then**: System flags as premium conversion  
**So**: Retargeting campaigns focus on high-value customers

#### Scenario 3: Subscription Signups
**When**: Customer purchases recurring CBD subscription  
**Then**: System tracks subscription conversion separately  
**So**: Business can measure LTV vs one-time purchases

---

## Functional Requirements

### Core Requirements

#### 1. Product Data Extraction
- **FR-001**: System MUST extract line items from Shopify order webhooks
- **FR-002**: Each line item MUST include product ID, title, quantity, price, SKU
- **FR-003**: System MUST auto-categorize CBD products (oils, edibles, topicals)
- **FR-004**: Product categorization MUST be configurable per customer

#### 2. Enhanced Conversion Tracking  
- **FR-005**: System MUST upload multiple conversions per order (category + total)
- **FR-006**: Each product category MUST have separate Google Ads conversion action
- **FR-007**: System MUST track high-value purchases (>€100) separately
- **FR-008**: System MUST identify subscription vs one-time purchases

#### 3. Data Storage & Analytics
- **FR-009**: System MUST store product details in database
- **FR-010**: System MUST track product categories per order
- **FR-011**: System MUST calculate product-specific revenue attribution
- **FR-012**: System MUST provide product performance analytics

#### 4. Google Ads Integration
- **FR-013**: System MUST support multiple conversion actions per customer
- **FR-014**: Each conversion MUST include product category data
- **FR-015**: System MUST handle conversion failures gracefully
- **FR-016**: System MUST provide conversion upload status tracking

### Non-Functional Requirements

#### Performance
- **NFR-001**: Webhook processing MUST complete in under 2 seconds
- **NFR-002**: Database queries MUST respond in under 100ms
- **NFR-003**: Conversion uploads MUST complete within 30 seconds

#### Security & Privacy
- **NFR-004**: Product data MUST be stored encrypted
- **NFR-005**: GCLID hashing MUST use SHA-256 with salt
- **NFR-006**: Customer data MUST comply with GDPR

#### Reliability
- **NFR-007**: System MUST handle webhook delivery failures with retry
- **NFR-008**: Conversion upload failures MUST NOT block order processing
- **NFR-009**: System MUST maintain 99.9% uptime

---

## Data Model & Key Entities

### Enhanced Order Data
```
Order {
  order_id: string
  customer_email: string
  total_value_cents: integer
  gclid_hash: string
  
  products: Product[]
  product_categories: string[]
  high_value_order: boolean
  subscription_items: Product[]
  discount_amount_cents: integer
  shipping_country: string
  
  created_at: datetime
  updated_at: datetime
}

Product {
  product_id: string
  title: string
  sku: string
  category: string
  quantity: integer
  unit_price_cents: integer
  total_price_cents: integer
  is_subscription: boolean
}
```

### Conversion Actions Mapping
```
GoogleAdsConversion {
  conversion_action_id: string
  gclid: string
  conversion_value: number
  currency_code: string
  order_id: string
  product_category: string
  customer_type: 'new' | 'returning'
  premium_customer: boolean
}
```

---

## Assumptions & Constraints

### Assumptions
- **AS-001**: Shopify webhook structure includes line items data
- **AS-002**: Customer will create 6 Google Ads conversion actions
- **AS-003**: Product categorization rules can be derived from titles/SKUs
- **AS-004**: Orders contain identifiable CBD product patterns

### Constraints
- **CN-001**: Cannot modify Shopify storefront code
- **CN-002**: Must maintain backward compatibility with existing webhooks
- **CN-003**: Google Ads API rate limits apply
- **CN-004**: Database schema changes require migration

---

## Success Criteria

### Primary Metrics
- **SC-001**: 100% of orders include product-level tracking data
- **SC-002**: 95% of products automatically categorized correctly
- **SC-003**: Conversion upload success rate >99%
- **SC-004**: Webhook processing time <2 seconds

### Business Outcomes
- **SC-005**: Marketing can optimize bids by product category
- **SC-006**: ROAS improves by 15-25% through better data
- **SC-007**: High-value customers can be targeted specifically
- **SC-008**: Product performance analytics available within 7 days

### Quality Gates
- **SC-009**: All existing functionality remains intact
- **SC-010**: No performance degradation in order processing
- **SC-011**: GDPR compliance maintained throughout
- **SC-012**: Data migration completes without errors

---

## Edge Cases & Error Handling

### Edge Cases
1. **Orders with 100+ products** - System must handle bulk processing
2. **Unknown product categories** - Default to "other_cbd_products"
3. **Missing SKUs** - Process without SKU data
4. **Duplicate GCLIDs** - Handle multiple orders with same GCLID
5. **Partial conversion failures** - Log and continue with other conversions

### Error Handling
- **Invalid webhook signature** - Return 401, log attempt
- **Missing product data** - Process with available information
- **Google Ads API failure** - Queue for retry, don't block order
- **Database connection loss** - Cache data, retry connection

---

## Key Integrations

### Shopify Webhook Enhancement
- **Endpoint**: `/api/v1/shopify/webhook` (existing)
- **Topics**: `orders/create`, `orders/paid` (existing)
- **Processing**: Enhanced line item extraction and categorization

### Google Ads API Expansion  
- **Multiple Actions**: Category-specific conversion tracking
- **Enhanced Data**: Product category, customer type, premium flags
- **Batch Upload**: Upload all related conversions together

### Database Schema Updates
- **New Fields**: product_details, product_categories, high_value_product
- **New Tables**: products, order_products (analytics)
- **Indexes**: Performance optimization for queries

---

## Testing Strategy

### Unit Tests
- Product categorization logic accuracy
- Conversion data structure validation  
- Error handling for API failures
- Database migration verification

### Integration Tests
- End-to-end webhook processing
- Google Ads conversion upload
- Multi-product order handling
- High-value order detection

### Performance Tests
- Webhook processing under load (1000 concurrent)
- Database query performance
- Conversion upload batch processing

---

## Dependencies

### External Dependencies
- **Shopify Webhook API** - Enhanced payload processing
- **Google Ads API v21** - Multiple conversion actions
- **Cloudflare D1** - Enhanced schema migration

### Internal Dependencies  
- **Current webhook infrastructure** - Extend existing processing
- **GCLID hashing service** - Existing implementation
- **Database migration system** - Schema updates

---

## Risk Assessment

### High Risk
- **Backward compatibility** - Breaking existing webhook processing
- **Google Ads limits** - Hitting API quotas with multiple conversions

### Medium Risk
- **Product categorization accuracy** - Manual rules may miss edge cases
- **Data migration complexity** - Schema changes in production

### Mitigation Strategy
- **Phased rollout** - Feature flag for gradual deployment
- **Comprehensive testing** - Full test coverage before production
- **Monitoring** - Real-time alerts for processing failures

---

## Acceptance Criteria

### Minimum Viable Product
- [ ] Multi-product orders track individual items
- [ ] CBD products auto-categorized with >80% accuracy
- [ ] Google Ads receives category-specific conversions
- [ ] Database stores enhanced order details

### Complete Feature
- [ ] All product categories tracked accurately (>95% accuracy)
- [ ] High-value customers identified and flagged
- [ ] Subscription revenue tracked separately
- [ ] Product performance dashboard available
- [ ] All performance criteria met
- [ ] Full regression testing completed

---

**Ready for Implementation Planning** ✅