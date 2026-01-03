# Frontend Deployment Guide

This guide walks through deploying the AdsEngineer frontend to production.

## Prerequisites

- Frontend application built and tested
- Hosting provider account (Vercel, Netlify, or Cloudflare Pages recommended)
- Production API URL configured

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd frontend
vercel --prod
```

### Step 4: Configure Environment Variables
In Vercel dashboard or via CLI:
```bash
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_API_BASE_URL
```

## Option 2: Deploy to Netlify

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Initialize Site
```bash
cd frontend
netlify init
```

### Step 4: Deploy
```bash
netlify deploy --prod --dir=dist
```

### Step 5: Configure Environment Variables
In Netlify dashboard or via CLI:
```bash
netlify env:set VITE_STRIPE_PUBLISHABLE_KEY
netlify env:set VITE_API_BASE_URL
```

## Option 3: Deploy to Cloudflare Pages

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler auth login
```

### Step 3: Deploy
```bash
cd frontend
wrangler pages deploy dist --compatibility-date=2024-01-01
```

### Step 4: Configure Environment Variables
In Cloudflare Pages dashboard.

## Environment Variables Required

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# API
VITE_API_BASE_URL=https://advocate-cloud.adsengineer.workers.dev

# Optional
VITE_ENVIRONMENT=production
```

## Build Process

Before deploying, ensure the app is built:

```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` directory with production assets.

## Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Stripe payment forms work
- [ ] API calls succeed
- [ ] SSL certificate is valid
- [ ] Domain resolves correctly
- [ ] Mobile responsive design works
- [ ] All links and navigation work

## Custom Domain Setup

If using a custom domain:
1. Purchase domain from registrar
2. Configure DNS in hosting provider
3. Update CORS in backend if needed
4. Update environment variables

## Monitoring

Set up monitoring for:
- Page load performance
- JavaScript errors
- API call failures
- Payment conversion rates