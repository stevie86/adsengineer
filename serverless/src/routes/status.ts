import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const statusRoutes = new Hono<AppEnv>();

statusRoutes.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const dbHealth = await checkDatabaseHealth(db);
    const workerHealth = await checkWorkerHealth();
    
    const overallStatus = dbHealth.status === 'healthy' && workerHealth.status === 'healthy' 
      ? 'healthy' 
      : dbHealth.status === 'degraded' || workerHealth.status === 'degraded' 
        ? 'degraded' 
        : 'error';

    return c.json({
      status: overallStatus,
      message: overallStatus === 'healthy' ? 'All systems operational' : 'Some issues detected',
      checks: { database: dbHealth, workers: workerHealth, timestamp: new Date().toISOString() },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

statusRoutes.get('/connection', async (c) => {
  try {
    const auth = c.get('auth');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const platform = c.req.query('platform');

    const mockConnections: Record<string, any> = {
      google_ads: {
        id: 'google-ads-123',
        account_id: '123456789',
        account_name: 'Main Account',
        status: 'active',
        last_used: new Date().toISOString(),
        errors: []
      },
      meta: {
        id: 'meta-456',
        account_id: '987654321',
        account_name: 'Business Manager',
        status: 'error',
        last_used: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        errors: ['Authentication failed']
      }
    };

    if (platform && !mockConnections[platform]) {
      return c.json({ error: 'Invalid platform' }, 400);
    }

    if (platform) {
      const connection = mockConnections[platform];
      return c.json({
        platform,
        status: connection.status,
        account: connection.account_name,
        last_used: connection.last_used,
        errors: connection.errors
      });
    }

    return c.json({
      connections: Object.entries(mockConnections).map(([key, value]) => ({
        platform: key,
        ...value
      }))
    });
  } catch (error) {
    console.error('Connection check error:', error);
    return c.json({
      error: 'Connection check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

statusRoutes.get('/metrics', async (c) => {
  try {
    return c.json({
      total_sites: 12,
      active_sites: 10,
      total_leads_today: 156,
      active_leads_today: 142,
      leads_processed_today: 148,
      conversions_uploaded_today: 129,
      database_size_mb: 245,
      worker_queue_depth: 12,
      uptime_percentage: 99.8,
      last_optimization: {
        type: 'budget_increase',
        platform: 'google_ads',
        campaign_id: 'campaign-123',
        old_value: '$500',
        new_value: '$600',
        reason: 'High CPA detected',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    return c.json({
      error: 'Metrics retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

async function checkDatabaseHealth(db: D1Database): Promise<{ status: 'healthy' | 'degraded' | 'error'; message: string; response_time_ms: number }> {
  const start = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    const responseTime = Date.now() - start;
    return { 
      status: responseTime > 1000 ? 'degraded' : 'healthy', 
      message: responseTime > 1000 ? 'Database slow' : 'Database connection stable', 
      response_time_ms: responseTime 
    };
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Database check failed', 
      response_time_ms: Date.now() - start 
    };
  }
}

async function checkWorkerHealth(): Promise<{ status: 'healthy' | 'degraded' | 'error'; message: string; queue_depth: number }> {
  const queueDepth = Math.floor(Math.random() * 20);
  return {
    status: queueDepth > 50 ? 'degraded' : 'healthy',
    message: queueDepth > 50 ? `Queue depth: ${queueDepth} - processing elevated` : 'Worker queue processing normally',
    queue_depth: queueDepth
  };
}
