import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../types';

export const demoRoutes = new Hono<AppEnv>();

const DEMO_PRODUCTS = [
  {
    id: 101,
    name: 'Sustainable Bamboo Toothbrush Set',
    slug: 'sustainable-bamboo-toothbrush-set',
    description:
      'Eco-friendly bamboo toothbrush with charcoal brixtles. Biodegradable handle, cruelty-free packaging. Set of 4 includes 2 soft and 2 medium bristles.',
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
        name: 'Main product image',
      },
    ],
    attributes: [
      {
        name: 'Material',
        options: ['Bamboo', 'Charcoal Bristles'],
      },
      {
        name: 'Bristle Hardness',
        options: ['Soft', 'Medium'],
      },
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
    description:
      "100% organic cotton tote bag with reinforced handles. Perfect for grocery shopping, farmer's market runs, or daily use. Machine washable, durable canvas.",
    price: 24.0,
    regular_price: 28.0,
    category: 'Accessories',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 100,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/8B4513/FFFFFF?text=Tote+Bag',
        alt: 'Organic cotton tote bag on white background',
        name: 'Main product image',
      },
    ],
    attributes: [
      {
        name: 'Material',
        options: ['Organic Cotton', 'Canvas'],
      },
      {
        name: 'Size',
        options: ['Large'],
      },
    ],
    tags: ['organic', 'sustainable', 'reusable', 'canvas'],
    featured: false,
    rating_count: 89,
    average_rating: 4.6,
  },
  {
    id: 103,
    name: 'Natural Deodorant Stick',
    slug: 'natural-deodorant-stick',
    description:
      'Aluminum-free natural deodorant stick with essential oils. Long-lasting protection, no harsh chemicals. Gentle on sensitive skin.',
    price: 8.99,
    regular_price: 11.99,
    category: 'Personal Care',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 75,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/4CAF50/FFFFFF?text=Deodorant',
        alt: 'Natural deodorant stick on white background',
        name: 'Main product image',
      },
    ],
    attributes: [
      {
        name: 'Scent',
        options: ['Lavender', 'Citrus', 'Unscented'],
      },
    ],
    tags: ['natural', 'aluminum-free', 'sensitive-skin'],
    featured: true,
    rating_count: 156,
    average_rating: 4.5,
  },
  {
    id: 104,
    name: 'Reusable Water Bottle',
    slug: 'reusable-water-bottle',
    description:
      'Stainless steel reusable water bottle with bamboo lid. Double-wall insulation keeps drinks cold for 24 hours. BPA-free, leak-proof design.',
    price: 29.99,
    regular_price: 34.99,
    category: 'Accessories',
    stock_status: 'instock',
    manage_stock: true,
    stock_quantity: 40,
    images: [
      {
        src: 'https://via.placeholder.com/800x800/2196F3/FFFFFF?text=Water+Bottle',
        alt: 'Stainless steel water bottle with bamboo lid',
        name: 'Main product image',
      },
    ],
    attributes: [
      {
        name: 'Capacity',
        options: ['500ml', '750ml'],
      },
    ],
    tags: ['stainless-steel', 'insulated', 'bamboo', 'leak-proof'],
    featured: false,
    rating_count: 201,
    average_rating: 4.8,
  },
];

/**
 * GET /api/v1/demo/products
 * Returns demo WooCommerce products for testing
 */
demoRoutes.get('/products', async (c) => {
  const { category, featured, limit } = c.req.query();

  let products = [...DEMO_PRODUCTS];

  if (category) {
    products = products.filter((p) => p.category === category);
  }

  if (featured === 'true') {
    products = products.filter((p) => p.featured);
  }

  let limitNum = 10;
  if (limit) {
    limitNum = parseInt(limit, 10);
  }

  return c.json({
    success: true,
    products: products.slice(0, limitNum),
    total: products.length,
    demo: true,
  });
});

/**
 * GET /api/v1/demo/products/:id
 * Returns specific demo product
 */
demoRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id');

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
    product: product,
    demo: true,
  });
});


