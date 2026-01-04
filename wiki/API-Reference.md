# API Reference

Complete REST API documentation for AdsEngineer.

## Base URL
```
Production: https://adsengineer-cloud.adsengineer.workers.dev
Development: http://localhost:8787
```

## Authentication

Most endpoints require JWT authentication:

```bash
curl -H "Authorization: Bearer <your_token>" \
     https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads
```

## Endpoints

### Health & Status

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-03T15:00:00Z",
  "environment": "production"
}
```

#### GET /api/v1/status
System status (requires authentication).

**Response:**
```json
{
  "system": "healthy",
  "database": "connected",
  "queue_size": 0,
  "last_conversion": "2026-01-03T14:30:00Z"
}
```

### Webhook Endpoints

#### POST /api/v1/ghl/webhook
Receive GoHighLevel contact data.

**Headers:**
- `X-GHL-Signature` - HMAC signature verification

**Request Body:**
```json
{
  "contact": {
    "id": "contact_123",
    "email": "lead@example.com",
    "phone": "+1234567890",
    "customField": {
      "gclid": "EAIaIQv3i3m8e7vOZ-1572532743"
    }
  },
  "locationId": "loc_456"
}
```

**Response:**
```json
{
  "success": true,
  "lead_id": "lead_abc123",
  "gclid_captured": true,
  "conversion_ready": false,
  "message": "Lead captured successfully"
}
```

#### POST /api/v1/shopify/webhook
Receive Shopify customer and order data.

**Headers:**
- `X-Shopify-Topic` - Webhook event type
- `X-Shopify-Shop-Domain` - Store domain

**Response:**
```json
{
  "status": "success",
  "lead_id": "shop_123",
  "topic": "orders/create",
  "shop_domain": "mystore.myshopify.com"
}
```

### Lead Management

#### GET /api/v1/leads
List all leads (requires authentication).

**Query Parameters:**
- `limit` - Number of leads to return (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "leads": [
    {
      "id": "lead_123",
      "email": "lead@example.com",
      "gclid": "EAIaIQv3i3m8e7vOZ-1572532743",
      "status": "pending",
      "value_cents": 50000,
      "created_at": "2026-01-03T14:30:00Z"
    }
  ],
  "total": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

#### POST /api/v1/leads
Create new lead (requires authentication).

**Request Body:**
```json
{
  "email": "new@example.com",
  "gclid": "EAIaIQv3i3m8e7vOZ-1572532743",
  "value_cents": 75000,
  "status": "qualified"
}
```

### Admin Operations

#### GET /api/v1/admin/stats
System statistics (requires admin token).

**Response:**
```json
{
  "totals": {
    "leads": 1250,
    "conversions": 890,
    "waitlist": 450
  },
  "trends": {
    "leads_last_7_days": [45, 67, 23, 89, 12, 56, 78]
  }
}
```

#### GET /api/v1/admin/backup
Encrypted database backup (requires admin token).

**Response:**
```json
{
  "encrypted": true,
  "exported_at": "2026-01-03T15:00:00Z",
  "data": "base64_encoded_ciphertext",
  "iv": "base64_encoded_iv"
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|-------|-------------|-------------|
| `invalid_token` | 401 | JWT token is invalid or expired |
| `missing_required` | 400 | Required field is missing |
| `rate_limit_exceeded` | 429 | Too many requests |
| `webhook_signature_failed` | 401 | Webhook signature verification failed |
| `conversion_failed` | 500 | Unable to process conversion |

## Rate Limiting

- **API endpoints:** 60 requests/minute
- **Webhook IP:** 100 requests/hour  
- **Webhook shop:** 1000 requests/hour

Rate limit headers are included in all responses:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Reset timestamp

## Testing

Use the health endpoint to test your setup:

```bash
# Test health
curl -f https://adsengineer-cloud.adsengineer.workers.dev/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     https://adsengineer-cloud.adsengineer.workers.dev/api/v1/status
```

## SDK Examples

Coming soon: JavaScript SDK for easy integration.

---

**Next:** Read [Configuration](Configuration.md) for environment setup.