# Custom Domain Setup Guide

This guide walks through setting up a custom domain (adsengineer.com) for AdsEngineer production.

## Prerequisites

- Domain registrar account (Namecheap, GoDaddy, etc.)
- Cloudflare account
- AdsEngineer deployed to production

## Step 1: Purchase Domain

1. Go to a domain registrar (recommended: Namecheap or Porkbun)
2. Search for "adsengineer.com"
3. Purchase the domain
4. Note down the nameservers provided by the registrar

## Step 2: Set Up Cloudflare

1. Sign up for Cloudflare (https://cloudflare.com)
2. Add your domain to Cloudflare:
   - Go to Websites → Add a site
   - Enter "adsengineer.com"
   - Follow the setup wizard
   - Update your domain's nameservers to Cloudflare's nameservers

3. In Cloudflare Dashboard:
   - Go to DNS → Records
   - Add a CNAME record:
     - Name: `api` (or `@` for root)
     - Target: `advocate-cloud.adsengineer.workers.dev`
     - Proxy status: Proxied (orange cloud)

## Step 3: Configure Cloudflare Workers

1. In Cloudflare Dashboard, go to Workers & Pages
2. Find your "advocate-cloud" worker
3. Go to Triggers → Custom Domains
4. Click "Add Custom Domain"
5. Enter your domain: `adsengineer.com` (or `api.adsengineer.com`)
6. Wait for SSL certificate to provision (can take a few minutes)

## Step 4: Update CORS Configuration

Update the CORS settings in your Worker to allow the new domain:

```typescript
// In serverless/src/index.ts
app.use('*', cors({
  origin: [
    'https://adsengineer.com',
    'https://app.adsengineer.com',
    'https://api.adsengineer.com',
    'https://app.advocate.com', // existing
    'http://localhost:3000',   // dev
    'http://localhost:8090'    // dev
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

## Step 5: Update Environment Variables

Update your frontend environment to use the new API URL:

```bash
# In frontend/.env.production
VITE_API_BASE_URL=https://api.adsengineer.com
```

## Step 6: Test Domain

1. Deploy your changes
2. Visit https://adsengineer.com/health
3. Test the signup flow end-to-end
4. Verify SSL certificate is valid

## Alternative: Subdomain Setup

If you prefer subdomains:

1. Set up `api.adsengineer.com` for the API
2. Set up `app.adsengineer.com` for the frontend
3. Keep `adsengineer.com` for marketing/landing page

### DNS Records for Subdomains:
```
CNAME api     advocate-cloud.adsengineer.workers.dev
CNAME app     your-frontend-hosting.com
A     @       your-marketing-site-ip
```

## Step 7: SSL & Security

1. Cloudflare automatically provides SSL
2. Enable "Always Use HTTPS" in Cloudflare
3. Set up HSTS headers if needed
4. Consider setting up security headers via Cloudflare

## Step 8: Update Marketing Materials

1. Update all documentation to reference the new domain
2. Update email templates
3. Update any hardcoded URLs in the codebase

## Troubleshooting

### Domain Not Resolving
- Check DNS propagation: `dig adsengineer.com`
- Verify nameservers are updated
- Check Cloudflare DNS records are correct

### SSL Issues
- Wait 24-48 hours for SSL certificate
- Check Cloudflare's SSL/TLS settings
- Ensure domain is properly verified

### CORS Errors
- Verify the origin is added to CORS configuration
- Check that credentials are allowed
- Test with browser dev tools

### API Not Working
- Verify the CNAME points to the correct Worker
- Check Worker is deployed and healthy
- Test direct Worker URL still works

## Performance Optimization

1. Enable Cloudflare caching for static assets
2. Set up page rules for performance
3. Consider Cloudflare Workers KV for caching
4. Monitor with Cloudflare Analytics

## Support

If you encounter issues:
1. Check Cloudflare status page
2. Review DNS propagation
3. Test with different browsers/devices
4. Contact Cloudflare support for domain issues