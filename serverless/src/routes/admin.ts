import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminSecret = c.env.ADMIN_SECRET;

  if (!adminSecret) {
    return c.json({ error: 'Admin endpoint not configured' }, 503);
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  if (token !== adminSecret) {
    return c.json({ error: 'Invalid admin token' }, 403);
  }

  await next();
});

adminRoutes.get('/backup', async (c) => {
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  try {
    const [leads, waitlist, triggers] = await Promise.all([
      db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all(),
      db.prepare('SELECT * FROM waitlist ORDER BY created_at DESC').all(),
      db.prepare('SELECT * FROM optimization_triggers ORDER BY created_at DESC').all(),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        leads: leads.results,
        waitlist: waitlist.results,
        optimization_triggers: triggers.results,
      },
      counts: {
        leads: leads.results.length,
        waitlist: waitlist.results.length,
        optimization_triggers: triggers.results.length,
      },
    };

    if (!encryptionKey) {
      return c.json({
        warning: 'BACKUP_ENCRYPTION_KEY not set - returning unencrypted',
        ...backup,
      });
    }

    const encrypted = await encryptBackup(JSON.stringify(backup), encryptionKey);

    return c.json({
      encrypted: true,
      exported_at: backup.exported_at,
      counts: backup.counts,
      data: encrypted.ciphertext,
      iv: encrypted.iv,
    });
  } catch (error) {
    console.error('Backup error:', error);
    return c.json(
      {
        error: 'Backup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

adminRoutes.post('/backup/decrypt', async (c) => {
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return c.json({ error: 'BACKUP_ENCRYPTION_KEY not configured' }, 503);
  }

  try {
    const { data, iv } = await c.req.json<{ data: string; iv: string }>();

    if (!data || !iv) {
      return c.json({ error: 'Missing data or iv fields' }, 400);
    }

    const decrypted = await decryptBackup(data, iv, encryptionKey);
    const backup = JSON.parse(decrypted);

    return c.json(backup);
  } catch (error) {
    console.error('Decrypt error:', error);
    return c.json(
      {
        error: 'Decryption failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

adminRoutes.get('/stats', async (c) => {
  const db = c.env.DB;

  try {
    const [leadsCount, waitlistCount, recentLeads] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM leads').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>(),
      db
        .prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
        .all(),
    ]);

    return c.json({
      totals: {
        leads: leadsCount?.count || 0,
        waitlist: waitlistCount?.count || 0,
      },
      leads_last_7_days: recentLeads.results,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

async function encryptBackup(
  plaintext: string,
  keyString: string
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptBackup(
  ciphertext: string,
  ivString: string,
  keyString: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyMaterial, data);

  return decoder.decode(plaintext);
}
