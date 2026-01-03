# Email Service Setup Guide

This guide walks through setting up email services for AdsEngineer (user verification, notifications).

## Prerequisites

- SMTP provider account (SendGrid, Mailgun, AWS SES, or similar)
- Domain configured for email sending
- Backend deployed with email configuration

## Option 1: SendGrid (Recommended for Ease of Use)

### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your email and domain
3. Create an API key

### Step 2: Configure Environment Variables
```bash
# In Cloudflare Workers production
wrangler secret put SMTP_HOST --env production
# smtp.sendgrid.net

wrangler secret put SMTP_PORT --env production
# 587

wrangler secret put SMTP_USER --env production
# apikey

wrangler secret put SMTP_PASS --env production
# Your SendGrid API key (SG.xxxx...)

wrangler secret put FROM_EMAIL --env production
# noreply@adsengineer.com
```

### Step 3: Domain Verification
In SendGrid dashboard:
- Go to Settings → Sender Authentication
- Verify your domain
- Add noreply@adsengineer.com as a sender

## Option 2: Mailgun

### Step 1: Create Mailgun Account
1. Sign up at https://mailgun.com
2. Add and verify your domain
3. Get SMTP credentials

### Step 2: Configure Environment Variables
```bash
wrangler secret put SMTP_HOST --env production
# smtp.mailgun.org

wrangler secret put SMTP_PORT --env production
# 587

wrangler secret put SMTP_USER --env production
# postmaster@yourdomain.mailgun.org

wrangler secret put SMTP_PASS --env production
# Your Mailgun SMTP password

wrangler secret put FROM_EMAIL --env production
# noreply@adsengineer.com
```

## Option 3: AWS SES

### Step 1: Set Up AWS SES
1. Create AWS account
2. Enable SES in your region
3. Verify domain and email addresses
4. Get SMTP credentials

### Step 2: Configure Environment Variables
```bash
wrangler secret put SMTP_HOST --env production
# email-smtp.us-east-1.amazonaws.com

wrangler secret put SMTP_PORT --env production
# 587

wrangler secret put SMTP_USER --env production
# Your SES SMTP username

wrangler secret put SMTP_PASS --env production
# Your SES SMTP password

wrangler secret put FROM_EMAIL --env production
# noreply@adsengineer.com
```

## Email Templates

Create these email templates in your provider:

### 1. Email Verification
**Subject:** Verify your AdsEngineer account
**Content:** Welcome! Click here to verify: [verification_link]

### 2. Welcome Email
**Subject:** Welcome to AdsEngineer!
**Content:** Your account is set up. Get started with conversion tracking.

### 3. Payment Confirmation
**Subject:** Payment received - Welcome to AdsEngineer
**Content:** Your subscription is active. Access your dashboard.

### 4. Subscription Updates
**Subject:** Subscription update
**Content:** Your plan has been updated/changed/cancelled.

## Testing Email Delivery

1. Test SMTP connection:
```bash
# Use a tool like swaks or telnet to test SMTP
swaks --to test@example.com --server smtp.sendgrid.net --port 587 --auth-user apikey --auth-pass SG.xxx
```

2. Send test emails from your application

3. Check spam folders and delivery logs

## Monitoring & Compliance

### Delivery Monitoring
- Set up webhooks for delivery events
- Monitor bounce rates (<2%)
- Track open/click rates

### Compliance
- Include unsubscribe links
- Add physical mailing address
- Comply with CAN-SPAM/GDPR
- Keep email list clean

### Backup Provider
- Have a backup SMTP provider ready
- Implement failover logic if needed

## Troubleshooting

### Emails Not Sending
- Check SMTP credentials
- Verify domain/SPF/DKIM/DMARC
- Check firewall/port blocking
- Review SMTP logs

### Emails Going to Spam
- Authenticate domain properly
- Use reputable SMTP provider
- Avoid spam trigger words
- Monitor sender reputation

### High Bounce Rate
- Clean email list regularly
- Use double opt-in
- Monitor invalid addresses
- Implement bounce handling

## Cost Optimization

- SendGrid: Free tier for 100 emails/day, then $0.0006/email
- Mailgun: Free tier for 5,000 emails/month, then $0.0005/email
- AWS SES: $0.0001/email (pay as you go)

Start with SendGrid for simplicity and ease of setup.