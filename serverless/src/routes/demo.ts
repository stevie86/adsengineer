import { zValidator } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';

const demoRoutes = new Hono<AppEnv>();

const DEMO_PRODUCTS = [
  {
    id: 101,
    name: 'Sustainable Bamboo Toothbrush Set',
    slug: 'sustainable-bamboo-toothbrush-set',
    description: 'Eco-friendly bamboo toothbrush with charcoal brixtles. Biodegradable handle, cruelty-free packaging. Set of 4 includes 2 soft and 2 medium bristles.',
    price: 12.99,
    regular_price: 14.99,
    category: 'Personal Care',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 50,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/2E7D32/FFFFFF?text=Bamboo+Toothbrush',
        alt: 'Bamboo toothbrush set on white background',
        name: 'Main product image'
      }
    ],
    attributes: [
      {
        name: 'Material',
        options: ['Bamboo', 'Charcoal Bristles']
      },
      {
        name: 'Bristle Hardness',
        options: ['Soft', 'Medium']
      }
    ],
    tags: ['eco-friendly', 'sustainable', 'zero-waste', 'bamboo'],
    featured: true,
    rating_count: 128,
    average_rating: 4.7,
  },
  {
    id: 102,
    name: 'Organic Cotton Tote Bag',
    slug: 'organic-cotton-tote-bag',
    description: '100% organic cotton tote bag with reinforced handles. Perfect for grocery shopping, farmer\'s market runs, or daily use. Machine washable, durable canvas.',
    price: 24.00,
    regular_price: 28.00,
    category: 'Accessories',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 75,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/4CAF50/FFFFFF?text=Organic+Cotton+Tote',
        alt: 'Organic cotton tote bag with natural look',
        name: 'Main product image'
      }
    ],
    attributes: [
      {
        name: 'Size',
        options: ['Standard (15" x 16")', 'Large (18" x 20")']
      },
      {
        name: 'Color',
        options: ['Natural', 'Black', 'Charcoal']
      }
    ],
    tags: ['organic', 'cotton', 'reusable', 'eco-friendly'],
    featured: true,
    rating_count: 89,
    average_rating: 4.8,
  },
  {
    id: 103,
    name: 'Artisan Ceramic Coffee Mug',
    slug: 'artisan-ceramic-coffee-mug',
    description: 'Handcrafted ceramic mug made by local artisans. Each piece is unique with subtle variations in glaze. 12oz capacity, dishwasher and microwave safe.',
    price: 18.50,
    regular_price: 22.00,
    category: 'Kitchen',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 30,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/795548/FFFFFF?text=Artisan+Ceramic+Mug',
        alt: 'Handmade ceramic mug with earthy glaze',
        name: 'Main product image'
      }
    ],
    attributes: [
      {
        name: 'Color',
        options: ['Terracotta', 'Sage Green', 'Navy Blue']
      }
    ],
    tags: ['handmade', 'ceramic', 'artisan', 'local', 'coffee'],
    featured: false,
    rating_count: 45,
    average_rating: 4.9,
  },
];

/**
 * GET /api/v1/demo/products
 * Returns demo WooCommerce products for testing
 */
demoRoutes.get(
  '/products',
  zValidator(
    'query',
    z.object({
      category: z.string().optional(),
      featured: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
  async (c) => {
    const { category, featured, limit } = c.req.valid('query');

    let products = [...DEMO_PRODUCTS];

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (featured === 'true') {
      products = products.filter((p) => p.featured);
    }

    const maxLimit = limit ? parseInt(limit, 10) : 10;
    products = products.slice(0, maxLimit);

    return c.json({
      success: true,
      data: {
        products,
        total: products.length,
        meta: {
          category: category || null,
          featured: featured === 'true' || false,
          limit: maxLimit,
        },
      },
    });
  }
);

/**
 * GET /api/v1/demo/products/:id
 * Returns a single demo product
 */
demoRoutes.get(
  '/products/:id',
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('param');
    const product = DEMO_PRODUCTS.find((p) => p.id === parseInt(id, 10));

    if (!product) {
      return c.json(
        {
          success: false,
          error: 'Product not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: { product },
    });
  }
);

/**
 * GET /api/v1/demo/templates/woocommerce-product
 * Returns a WooCommerce product template for manual order testing
 */
demoRoutes.get('/templates/woocommerce-product', async (c) => {
  const template = {
    id: 'TEMPLATE_ID',
    event: 'orders.created',
    status: 'completed',
    customer: {
      email: 'demo@example.com',
      phone: '+15551234567',
      first_name: 'Demo',
      last_name: 'User',
    },
    total: DEMO_PRODUCTS[0].price.toFixed(2),
    currency: 'USD',
    line_items: [
      {
        product_id: DEMO_PRODUCTS[0].id,
        quantity: 1,
        price: DEMO_PRODUCTS[0].price.toFixed(2),
        name: DEMO_PRODUCTS[0].name,
      },
    ],
    order_key: 'wc_order_demo_001',
    date_created_gmt: new Date().toISOString(),
  };

  return c.json({
    success: true,
    data: {
      template,
      usage: 'POST this payload to https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook',
      endpoint_info: 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/info',
    },
  });
});