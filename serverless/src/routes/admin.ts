import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Helper function to convert Uint8Array to base64 safely
function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array safely
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminSecret = c.env.ADMIN_SECRET;

  if (!adminSecret) {
    return c.json({ error: 'Admin endpoint not configured' }, 503);
  }

  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== adminSecret) {
    return c.json({ error: 'Unauthorized - Invalid admin token' }, 401);
  }

  await next();
});

// ============================================================================
// Backup Endpoints
// ============================================================================

/**
 * Generate encrypted backup of all data
 * Returns 503 if BACKUP_ENCRYPTION_KEY not configured (fail-close)
 */
adminRoutes.get('/backup', async (c) => {
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('Backup attempted without BACKUP_ENCRYPTION_KEY configured');

    return c.json({
      success: false,
      error: 'backup_encryption_required',
      code: 'BACKUP_ENCRYPTION_REQUIRED',
      message: 'Cannot perform backup without encryption key. Contact administrator.',
    }, 503);
  }

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

    const encrypted = await EncryptionService.getInstance().encrypt(JSON.stringify(backup));
    return c.json(backup);
  } catch (error) {
    return c.json({ error: 'Backup generation failed', details: error.message }, 500);
  }
});

/**
 * Decrypt backup data
 */
adminRoutes.post('/backup/decrypt', async (c) => {
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return c.json({ error: 'BACKUP_ENCRYPTION_KEY not configured' }, 503);
  }

  try {
    const body = await c.req.json();
    const decrypted = await EncryptionService.getInstance().decrypt(body);
    return c.json(decrypted);
  } catch (error) {
    return c.json({ error: 'Decryption failed', details: error.message }, 500);
  }
});
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('Backup attempted without BACKUP_ENCRYPTION_KEY configured');

    return c.json({
      success: false,
      error: 'backup_encryption_required',
      code: 'BACKUP_ENCRYPTION_REQUIRED',
      message: 'Cannot perform backup without encryption key. Contact administrator.',
    }, 503);
  }

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

  const encrypted = await encryptBackup(JSON.stringify(backup), encryptionKey);
  return c.json(backup);
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
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
    iv: uint8ArrayToBase64(iv),
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

  const iv = base64ToUint8Array(ivString);
  const data = base64ToUint8Array(ciphertext);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyMaterial, data);

  return decoder.decode(plaintext);
}
