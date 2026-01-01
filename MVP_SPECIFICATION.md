# MVP Specification: GHL Attribution Preservation System

## Core Problem
GoHighLevel agencies are losing **$100K-$2M/month** in Google Ads attribution due to cookie degradation. This MVP provides **server-side attribution preservation** to stop the bleeding.

## MVP Goal
**Single purpose**: Preserve Google Ads attribution that would otherwise be lost to cookie restrictions.

## What This MVP Does NOT Include
- ❌ Lead scoring systems
- ❌ Multi-channel notifications  
- ❌ Analytics dashboards
- ❌ Waitlist management
- ❌ Complex onboarding flows
- ❌ Attribution health scoring
- ❌ Optimization triggers

## Core MVP Components (5 files max)

### 1. GHL Webhook Receiver
**File**: `src/routes/ghl.ts`
- Receive GHL webhooks with lead data
- Extract and store: GCLID, FBCLID, UTM parameters, contact info
- Return success response

### 2. Attribution Storage
**File**: `src/database/index.ts` 
- Store leads with attribution data
- Simple schema: leads + agencies tables only
- No complex relationships or value calculations

### 3. Google Ads Uploader
**File**: `src/workers/offline-conversions.ts`
- Background processor to upload stored leads as conversions
- Basic retry logic (3 attempts)
- Support for both GCLID and enhanced conversions

### 4. First-Party ID Service
**File**: `src/services/first-party-id.ts`
- Generate persistent first-party IDs
- Hash customer data for enhanced conversions when GCLID unavailable
- Cookieless tracking fallback

### 5. Tracking Snippet
**File**: `src/snippet.ts`
- JavaScript for GHL landing pages
- Capture GCLID/UTM parameters client-side
- Send to server-side tracking endpoint

## Database Schema (Simplified)

```sql
-- Agencies table
CREATE TABLE agencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  google_ads_credentials TEXT, -- JSON encrypted
  conversion_action_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads table  
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  agency_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  gclid TEXT,
  fbclid TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  email TEXT,
  phone TEXT,
  first_party_id TEXT,
  conversion_uploaded BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id)
);
```

## API Endpoints (2 endpoints only)

### 1. GHL Webhook
```
POST /api/v1/ghl/webhook
```
- Receives lead data from GHL
- Stores attribution data
- Returns: `{ success: true, leadId: "xxx" }`

### 2. Health Check
```
GET /health
```
- Service status
- Database connectivity
- Returns: `{ status: "healthy", timestamp: "xxx" }`

### 3. Health Check
```
GET /health
```
- Service status
- Database connectivity
- Returns: `{ status: "healthy", timestamp: "xxx" }`

## Core Flow

### Step 1: Lead Capture
1. User clicks Google Ad → Lands on GHL page
2. JavaScript snippet captures GCLID/UTM parameters
3. User submits form → GHL webhook triggers
4. Your system stores lead with attribution data

### Step 2: Conversion Upload  
1. Background processor scans for unuploaded leads
2. Attempts conversion upload to Google Ads
3. If GCLID available → Standard conversion
4. If GCLID missing → Enhanced conversion with hashed data
5. Mark as uploaded after success

### Step 3: Attribution Preservation
- Google Ads receives conversion with proper attribution
- Agency sees accurate ROAS data
- No more lost attribution due to cookies

## Technical Requirements

### Environment
- Cloudflare Workers (serverless)
- D1 database (SQLite)
- No external dependencies beyond HTTP client

### Authentication
- Simple API key for webhook validation
- Google Ads OAuth credentials per agency

### Error Handling
- Basic retry logic (3 attempts)
- Error logging to console
- No complex alerting systems

## Success Metrics

### Technical
- >95% conversion upload success rate
- <5 second webhook processing time
- 100% attribution data capture rate

### Business
- Stop agencies' attribution data loss
- Enable accurate ROAS tracking
- Support crisis pricing ($799/mo)

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Set up stripped-down database schema
- [ ] Implement GHL webhook receiver
- [ ] Create basic Google Ads uploader

### Week 2: Conversion Processing
- [ ] Add background conversion processor
- [ ] Implement first-party ID service
- [ ] Create tracking snippet

### Week 3: Testing & Deployment
- [ ] Test with sample GHL webhooks
- [ ] Validate conversion uploads to Google Ads
- [ ] Deploy to production

## Post-MVP Future Features

Once the core attribution preservation is working:
- Basic analytics dashboard
- Simple notification system
- Lead value scoring
- Multi-touch attribution
- Advanced reporting

## Key Principles

1. **Speed over features** - Get this working ASAP
2. **Reliability over complexity** - Simple, robust system
3. **Core value first** - Attribution preservation, nothing else
4. **Crisis focus** - Agencies need this NOW during cookie apocalypse

## Risk Mitigation

### Technical Risks
- **Google Ads API changes**: Use stable REST API endpoints
- **Rate limiting**: Implement basic throttling
- **Data privacy**: Minimize data collection, comply with GDPR/CCPA

### Business Risks  
- **Scope creep**: Strict limit to 5 files, 3 endpoints
- **Feature bloat**: Any addition must prove essential for attribution preservation
- **Complexity creep**: Review each line - "Does this stop attribution loss?"

## Testing Strategy

### Unit Tests
- Webhook payload processing
- Attribution data extraction
- Google Ads upload formatting

### Integration Tests  
- End-to-end GHL webhook → Google Ads conversion
- Server-side click tracking fallback
- Enhanced conversions when GCLID missing

### Manual Testing
- Real GHL webhook from client agency
- Actual Google Ads conversion tracking
- Attribution verification in Google Ads interface

---

**Remember**: Agencies are losing millions per month. They need attribution salvation, not a feature-packed platform. Ship this MVP, get them working, then add features later.