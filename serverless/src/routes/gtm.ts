import { Hono } from 'hono';
import { GTMCompiler } from '../services/gtm-compiler';
import type { AppEnv } from '../types';

export const gtmRoutes = new Hono<AppEnv>();

gtmRoutes.post('/analyze', async (c) => {
  const { json } = await c.req.json<{ json: string }>();

  if (!json) {
    return c.json({ error: 'GTM JSON is required' }, 400);
  }

  try {
    const analysis = GTMCompiler.analyze(json);
    return c.json({
      success: true,
      analysis,
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error during analysis',
      },
      400
    );
  }
});
