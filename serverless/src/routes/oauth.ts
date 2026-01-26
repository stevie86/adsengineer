import type { Context } from 'hono';
import { Hono } from 'hono';
import { OAuthStorageService } from '../services/oauth-storage';

const oauthRoutes = new Hono();

// Google Ads OAuth initiation
oauthRoutes.get('/google-ads/init', async (c) => {
  const agencyId = c.req.query('state') || 'default';

  const scopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: c.env.GOOGLE_ADS_CLIENT_ID!,
      redirect_uri: `${c.env.BASE_URL}/api/v1/oauth/google-ads/callback`,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: agencyId,
    });

  return c.redirect(authUrl);
});

// OAuth callback handler
oauthRoutes.get('/google-ads/callback', async (c) => {
  const code = c.req.query('code');
  const agencyId = c.req.query('state');

  if (!code || !agencyId) {
    return c.json({ error: 'Missing authorization code or state' }, 400);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: c.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: c.env.GOOGLE_ADS_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${c.env.BASE_URL}/api/v1/oauth/google-ads/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('OAuth token exchange failed:', tokens.error);
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    // Store refresh token securely
    const oauthStorage = new OAuthStorageService();
    await oauthStorage.storeEncryptedTokens(agencyId, tokens);

    // Redirect to success page with state
    const successUrl = `${c.env.BASE_URL}/oauth/success?platform=google_ads&agency=${agencyId}`;
    return c.redirect(successUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'OAuth callback failed' }, 500);
  }
});

// Meta Ads OAuth initiation
oauthRoutes.get('/meta/init', async (c) => {
  const agencyId = c.req.query('state') || 'default';

  const scopes = ['ads_read', 'ads_management'];
  const authUrl =
    `https://www.facebook.com/v18.0/dialog/oauth?` +
    new URLSearchParams({
      client_id: c.env.META_APP_ID!,
      redirect_uri: `${c.env.BASE_URL}/api/v1/oauth/meta/callback`,
      scope: scopes.join(','),
      response_type: 'code',
      state: agencyId,
    });

  return c.redirect(authUrl);
});

// Meta OAuth callback
oauthRoutes.get('/meta/callback', async (c) => {
  const code = c.req.query('code');
  const agencyId = c.req.query('state');

  if (!code || !agencyId) {
    return c.json({ error: 'Missing authorization code or state' }, 400);
  }

  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: c.env.META_APP_ID!,
        client_secret: c.env.META_APP_SECRET!,
        redirect_uri: `${c.env.BASE_URL}/api/v1/oauth/meta/callback`,
        code: code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Meta OAuth token exchange failed:', tokens.error);
      return c.json({ error: 'Failed to exchange Meta authorization code' }, 400);
    }

    // Store Meta tokens
    const oauthStorage = new OAuthStorageService();
    await oauthStorage.storeEncryptedTokens(agencyId, { meta: tokens });

    const successUrl = `${c.env.BASE_URL}/oauth/success?platform=meta&agency=${agencyId}`;
    return c.redirect(successUrl);
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return c.json({ error: 'Meta OAuth callback failed' }, 500);
  }
});

// Get OAuth status
oauthRoutes.get('/status/:agencyId', async (c) => {
  const agencyId = c.req.param('agencyId');

  const oauthStorage = new OAuthStorageService();
  const tokens = await oauthStorage.getTokens(agencyId);

  return c.json({
    agency_id: agencyId,
    google_ads_connected: !!tokens?.google_ads?.refresh_token,
    meta_connected: !!tokens?.meta?.access_token,
    last_updated: tokens?.updated_at,
  });
});

export { oauthRoutes };
