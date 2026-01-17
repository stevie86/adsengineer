import { Hono } from 'hono';
import type { AppEnv } from '../types';

export interface EvaluationResult {
  success: boolean;
  message?: string;
  insights?: any;
}

const evaluation = new Hono<AppEnv>();

// Health check endpoint
evaluation.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Evaluation service is running',
    timestamp: new Date().toISOString()
  });
});

// Evaluate customer endpoint
evaluation.post('/evaluate', async (c) => {
  const db = c.get('db');
  const data = await c.req.json();
  
  try {
    const customer = await db
      .prepare('SELECT first_name, last_name FROM customers WHERE id = ?')
      .bind(data.customer_id)
      .first();

    return c.json({
      success: true,
      message: `Evaluation completed for customer ${customer.first_name || 'Unknown'}`,
      insights: {
        customer_id: data.customer_id,
        name: customer.first_name || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Simple evaluation error:', error);
    return c.json({
      success: false,
      message: `Failed to evaluate customer: ${error.message}`
    }, 500);
  }
});

export { evaluation as evaluationRouter };