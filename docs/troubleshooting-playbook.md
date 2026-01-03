# AdsEngineer Troubleshooting Playbook

## Emergency Contacts
- **Your Email**: [your-email]
- **Support Response Time**: < 2 hours during business days
- **Emergency**: Critical system down - immediate response

---

## Common Issues & Solutions

### Issue 1: Snippet Not Loading
**Symptoms**: Customers report tracking not working
**Check**: `curl https://advocate-cloud.adsengineer.workers.dev/snippet.js`
**Solution**:
1. Verify snippet.js exists in serverless/public/
2. Check Cloudflare deployment status
3. Redeploy if necessary: `wrangler deploy --env production`

### Issue 2: API Authentication Failing
**Symptoms**: 401 errors in logs, customers can't access dashboard
**Check**: JWT token validation in logs
**Solution**:
1. Verify JWT_SECRET is set: `wrangler secret list --env production`
2. Check token expiry (default: 24 hours)
3. Regenerate tokens if compromised

### Issue 3: Lead Processing Errors
**Symptoms**: Leads not appearing in Google Ads, API errors
**Check**: Cloudflare function logs
**Solution**:
1. Verify Google Ads credentials are configured
2. Check API quotas/limits
3. Test with dummy data: `./test-e2e.sh`

### Issue 4: Webhook Failures (Shopify)
**Symptoms**: Orders not tracked, Shopify integration broken
**Check**: Shopify webhook logs
**Solution**:
1. Reinstall webhooks from AdsEngineer dashboard
2. Verify Shopify API permissions
3. Check webhook URLs match: `https://advocate-cloud.adsengineer.workers.dev/api/v1/shopify/webhook`

### Issue 5: Database Connection Issues
**Symptoms**: 500 errors, data not saving
**Check**: D1 database status
**Solution**:
1. Verify DB binding in wrangler.jsonc
2. Check database quotas/limits
3. Monitor query performance

### Issue 6: GDPR Consent Validation Failing
**Symptoms**: Leads rejected, consent errors
**Check**: GDPR compliance logs
**Solution**:
1. Verify consent cookie implementation
2. Check consent expiry (30 days default)
3. Update consent mechanism if needed

---

## Step-by-Step Troubleshooting Process

### Step 1: Gather Information
```
What: Describe the problem
When: When did it start?
Who: Which customers affected?
How: Error messages/logs
Impact: Business impact level
```

### Step 2: Run Diagnostics
```bash
# Quick health check
./test-e2e.sh

# Check deployment status
wrangler deployments list --env production

# Monitor errors
tail -f monitoring/errors.log

# Test API endpoints
curl -H "Authorization: Bearer [token]" https://advocate-cloud.adsengineer.workers.dev/api/v1/leads
```

### Step 3: Identify Root Cause
- Check logs in Cloudflare dashboard
- Review recent deployments
- Test with isolated components
- Compare with working environments

### Step 4: Implement Fix
- Apply minimal fix first
- Test in staging if possible
- Deploy with rollback plan
- Monitor for 1 hour post-deployment

### Step 5: Communicate
```
To customer: "Issue identified and fixed. Monitoring for 24 hours."
To yourself: Document root cause and solution for future reference.
```

---

## Prevention Measures

### Daily Monitoring
```bash
# Set up cron job
crontab -e
# Add: 0 9 * * 1-5 ./monitoring/health-check.sh
# Add: 0 18 * * 1-5 ./monitoring/daily-report.sh
```

### Proactive Alerts
- API response time > 2000ms
- Error rate > 5%
- Conversion upload failures
- Database connection issues

### Backup Plans
- Manual tracking fallback for critical customers
- Alternative API endpoints
- Emergency credential rotation process

---

## Escalation Matrix

### Level 1: Standard Issues (< 4 hours)
- Snippet loading problems
- Minor API timeouts
- Dashboard access issues

### Level 2: Critical Issues (< 2 hours)
- Complete system outage
- Mass data loss
- Security breaches

### Level 3: Emergency (< 30 minutes)
- Customer data breach
- Legal compliance issues
- Revenue-impacting outages

---

## Customer Communication Templates

### During Outage:
```
"We're experiencing a temporary issue with [feature]. Our team is working on it.
Expected resolution: [timeframe]. We'll keep you updated."
```

### After Resolution:
```
"The issue has been resolved. Here's what happened and how we fixed it:
[Brief explanation]

To prevent this in the future, we've implemented [measures]."
```

### Proactive Communication:
```
"Minor maintenance window tonight 2-4 AM CET.
No service interruption expected, but monitoring closely."
```

---

## Recovery Time Objectives (RTO)

- **Critical Functions**: 1 hour
- **Standard Features**: 4 hours
- **Non-essential**: 24 hours
- **Monitoring**: 15 minutes

---

## Lessons Learned Log

**Date | Issue | Root Cause | Solution | Prevention**

*Keep this updated after each incident to improve response times.*

---

*This playbook ensures you can respond quickly and professionally to any issues.*</content>
<parameter name="filePath">docs/troubleshooting-playbook.md