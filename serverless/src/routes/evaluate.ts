import { Hono } from 'hono';
import { evaluationRouter } from '../services/evaluation-service';

const app = new Hono();

app.route('/api/v1/evaluate', evaluationRouter);

app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'adsengineer-evaluation-api',
      version: '1.0.0',
      endpoints: {
        evaluate: 'POST /api/v1/evaluate',
        status: 'GET /api/v1/evaluate/status/:jobId',
        templates: 'GET /api/v1/evaluate/templates',
      },
      capabilities: [
        'E-commerce platform detection',
        'Technology stack analysis',
        'Ad spend waste detection',
        'Optimization recommendations',
        'Confidence scoring',
        'ROI calculations',
      ],
      documentation: '/api/docs',
    },
  });
});

app.get('/api/docs', (c) => {
  return c.json({
    success: true,
    data: {
      title: 'AdsEngineer E-commerce Evaluation API',
      description: 'Comprehensive analysis service for optimizing e-commerce ad spend',
      usage: {
        evaluation: {
          endpoint: 'POST /api/v1/evaluate',
          description: 'Analyze e-commerce site for ad optimization opportunities',
          parameters: {
            url: 'Website URL to analyze',
            adSpend: 'Monthly ad spend data by platform',
          },
          response: 'Complete evaluation with waste detection and recommendations',
        },
        technologyDetection: {
          supported: ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Custom'],
          confidence: 'Confidence score based on detected patterns',
        },
        wasteDetection: {
          categories: [
            'No conversion tracking',
            'Incorrect attribution',
            'Poor targeting',
            'Technical issues',
            'Budget drift',
          ],
          calculations: 'Based on conversion value and ad spend analysis',
        },
      },
    },
  });
});

export default app;
