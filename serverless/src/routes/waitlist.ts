import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const waitlistRoutes = new Hono<AppEnv>();

interface WaitlistSignup {
  email: string;
  agency_name?: string;
  website?: string;
  monthly_ad_spend?: string;
  pain_point?: string;
  referral_source?: string;
}

waitlistRoutes.post('/', async (c) => {
  try {
    const body: WaitlistSignup = await c.req.json();

    if (!body.email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const db = c.env.DB;

    const existing = await db
      .prepare('SELECT id FROM waitlist WHERE email = ?')
      .bind(body.email.toLowerCase())
      .first();

    if (existing) {
      return c.json({
        success: true,
        message: 'You are already on the waitlist!',
        already_registered: true,
      });
    }

    const id = crypto.randomUUID();
    await db
      .prepare(`
      INSERT INTO waitlist (id, email, agency_name, website, monthly_ad_spend, pain_point, referral_source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        body.email.toLowerCase(),
        body.agency_name || null,
        body.website || null,
        body.monthly_ad_spend || null,
        body.pain_point || null,
        body.referral_source || null,
        new Date().toISOString()
      )
      .run();

    return c.json({
      success: true,
      message: 'Welcome to the waitlist! We will be in touch soon.',
      id,
    });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return c.json(
      {
        error: 'Signup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

waitlistRoutes.get('/count', async (c) => {
  try {
    const db = c.env.DB;
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM waitlist')
      .first<{ count: number }>();

    return c.json({
      waitlist_count: result?.count || 0,
      message: 'Join the waitlist to get early access!',
    });
  } catch (error) {
    return c.json({ waitlist_count: 0 });
  }
});
