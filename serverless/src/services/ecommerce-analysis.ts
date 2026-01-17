import { z } from 'zod';

// Core e-commerce analysis schemas
export const SiteAnalysisSchema = z.object({
  url: z.string().url(),
  domain: z.string(),
  sslStatus: z.enum(['secure', 'insecure', 'mixed']),
  platform: z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom', 'unknown']),
  platformVersion: z.string().optional(),
  googleAds: z.object({
    hasConversionTracking: z.boolean(),
    hasEnhancedEcommerce: z.boolean(),
    hasDynamicRemarketing: z.boolean(),
    hasShoppingCampaigns: z.boolean(),
    hasMerchantCenter: z.boolean(),
    conversionActionTypes: z.array(z.string()),
    lastSync: z.string().optional()
  }).optional(),
  metaAds: z.object({
    hasPixel: z.boolean(),
    hasConversionAPI: z.boolean(),
    hasCAPI: z.boolean(),
    hasCatalogSales: z.boolean(),
    conversionActionTypes: z.array(z.string()),
    lastSync: z.string().optional()
  }).optional(),
  tiktok: z.object({
    hasPixel: z.boolean(),
    hasConversionAPI: z.boolean(),
    hasWebEvents: z.boolean(),
    lastSync: z.string().optional()
  }).optional(),
  analytics: z.object({
    platform: z.enum(['google-analytics', 'adobe-analytics', 'mixpanel', 'segment', 'unknown']),
    enhancedEcommerce: z.boolean(),
    hasProductData: z.boolean(),
    hasRevenueTracking: z.boolean(),
    hasFunnelAnalysis: z.boolean()
  }).optional(),
  seo: z.object({
    title: z.string(),
    description: z.string().optional(),
    h1: z.string().optional(),
    structuredData: z.object({
      productSchema: z.enum(['schema.org', 'json-ld', 'microdata']),
      breadcrumbNav: z.boolean(),
      reviewStars: z.boolean(),
      priceMarkup: z.boolean(),
      faqSchema: z.boolean()
    })
  }),
  performance: z.object({
    pageSpeed: z.object({
      desktop: z.number().min(0).max(100),
      mobile: z.number().min(0).max(100),
      coreWebVitals: z.object({
        lcp: z.number().min(0),
        fid: z.number().min(0),
        cls: z.number().min(0)
      })
    }),
    mobileOptimization: z.enum(['excellent', 'good', 'needs-work', 'poor']),
    responsiveBreakpoints: z.array(z.string()),
    imageOptimization: z.enum(['excellent', 'good', 'needs-work', 'poor'])
  }),
  tracking: z.object({
    gtagImplementation: z.enum(['gtag.js', 'gtm', 'gtag.js', 'server-side', 'none']),
    consentManagement: z.enum(['none', 'basic', 'advanced', 'gdpr-full']),
    cookieCompliance: z.enum(['none', 'partial', 'full']),
    dataLayer: z.object({
      hasEcommerceEvents: z.boolean(),
      hasUserTracking: z.boolean(),
      hasProductData: z.boolean(),
      hasRevenueData: z.boolean()
    })
  })
});

export type SiteAnalysis = z.infer<typeof SiteAnalysisSchema>;

// Ad spend analysis schema
export const AdSpendAnalysisSchema = z.object({
  monthlySpend: z.number().min(0),
  platforms: z.array(z.object({
    platform: z.enum(['google-ads', 'meta-ads', 'tiktok-ads', 'linkedin-ads', 'microsoft-ads']),
    monthlySpend: z.number().min(0),
    ctr: z.number().min(0).max(1),
    cpc: z.number().min(0),
    conversionRate: z.number().min(0).max(1),
    cpa: z.number().min(0),
    roas: z.number().min(0),
    impressions: z.number().min(0),
    clicks: z.number().min(0),
    conversions: z.number().min(0),
    lastImportDate: z.string()
  })),
  attribution: z.object({
    model: z.enum(['last-click', 'first-click', 'linear', 'time-decay', 'data-driven', 'none']),
    conversionWindow: z.object({
      defaultDays: z.number().min(1).max(90),
      customWindows: z.array(z.object({
        name: z.string(),
        days: z.number().min(1).max(365),
        conditions: z.array(z.string())
      }))
    }),
    crossDevice: z.boolean(),
    offlineConversions: z.boolean()
  })
});

export type AdSpendAnalysis = z.infer<typeof AdSpendAnalysisSchema>;

// Product catalog analysis schema
export const ProductAnalysisSchema = z.object({
  totalProducts: z.number().min(0),
  trackedProducts: z.number().min(0),
  categories: z.array(z.object({
    name: z.string(),
    productCount: z.number().min(0),
    averagePrice: z.number().min(0),
    topSelling: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().min(0),
      salesCount: z.number().min(0)
    }))
  })),
  pricingStrategy: z.enum(['premium', 'competitive', 'value-based', 'cost-plus', 'unknown']),
  hasSeasonalPricing: z.boolean(),
  hasDynamicPricing: z.boolean(),
  hasPromotionTracking: z.boolean(),
  hasInventoryTracking: z.boolean(),
  hasCrossSellTracking: z.boolean(),
  hasUpSellTracking: z.boolean()
});

export type ProductAnalysis = z.infer<typeof ProductAnalysisSchema>;

// Waste detection schema
export const WasteAnalysisSchema = z.object({
  totalWastedSpend: z.number().min(0),
  wastePercentage: z.number().min(0).max(100),
  categories: z.array(z.object({
    type: z.enum(['no-tracking', 'wrong-attribution', 'poor-targeting', 'technical-issues', 'invalid-conversions', 'budget-drift', 'fraud']),
    description: z.string(),
    estimatedWaste: z.number().min(0),
    confidence: z.number().min(0).max(1),
    recommendations: z.array(z.string()),
    detectedIssues: z.array(z.string())
  })),
  opportunities: z.array(z.object({
    type: z.enum(['quick-win', 'strategic', 'technical', 'platform-optimization']),
    description: z.string(),
    potentialSavings: z.number().min(0),
    implementationDifficulty: z.enum(['easy', 'medium', 'hard']),
    timeToImplement: z.string(),
    impact: z.enum(['high', 'medium', 'low'])
  }))
});

export type WasteAnalysis = z.infer<typeof WasteAnalysisSchema>;

// Complete evaluation result
export const EvaluationResultSchema = z.object({
  siteAnalysis: SiteAnalysisSchema,
  adSpendAnalysis: AdSpendAnalysisSchema,
  productAnalysis: ProductAnalysisSchema,
  wasteAnalysis: WasteAnalysisSchema,
  confidence: z.number().min(0).max(1),
  recommendations: z.array(z.object({
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.enum(['tracking', 'attribution', 'technical', 'strategic', 'budget']),
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string(),
    implementation: z.object({
      steps: z.array(z.string()),
      complexity: z.enum(['easy', 'medium', 'hard']),
      estimatedTime: z.string(),
      cost: z.enum(['none', 'low', 'medium', 'high'])
    }),
    roi: z.object({
      paybackPeriod: z.string(),
      expectedSavings: z.number().min(0),
      confidence: z.number().min(0).max(1)
    })
  })),
  generatedAt: z.string(),
  version: z.string()
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// Technology detection patterns
export const TECHNOLOGY_PATTERNS = {
  shopify: {
    domains: ['.myshopify.com', '.shopifycdn.com'],
    scripts: ['ShopifyAnalytics', 'Shopify.theme', 'ShopifyBuyButton'],
    meta: ['shopify-checkout-api-token', 'shopify-digital-wallet'],
    cookies: ['_shopify_y', '_shopify_s'],
    apis: ['/admin/api/', '/cart.js', '/products.json']
  },
  woocommerce: {
    scripts: ['woocommerce', 'wc-add-to-cart', 'wc-checkout'],
    meta: ['woocommerce_version', 'wc-api-version'],
    apis: ['/wc-api/v3/', '?rest_route=/wc/'],
    classes: ['woocommerce', 'wc-']
  },
  magento: {
    scripts: ['Mage.Cookies', 'Mage.Cookies'],
    meta: ['magento-version', 'magento-edition'],
    apis: ['/rest/', '/V1/'],
    classes: ['Mage-', 'Magento_']
  },
  bigcommerce: {
    scripts: ['bigcommerce'],
    meta: ['bigcommerce-token'],
    apis: ['/api/', '/stores/'],
    structure: ['bc-', 'Bigcommerce']
  },
  googleAnalytics: {
    scripts: ['gtag', 'ga', 'analytics'],
    objects: ['gtag', 'ga', 'dataLayer'],
    events: ['page_view', 'purchase', 'add_to_cart']
  },
  googleAds: {
    scripts: ['googleads', 'google_conversion'],
    params: ['gclid', 'dclid', 'gad_source'],
    conversionFormat: ['google_business_online', 'google_retail_online']
  },
  metaAds: {
    scripts: ['fbevents', 'facebook', 'pixel'],
    params: ['fbclid', 'fbp', '_fbc'],
    conversionFormat: ['fb_pixel', 'fb_server_to_server']
  },
  tiktok: {
    scripts: ['tiktok', 'ttq'],
    params: ['ttclid', 'tiktok_click_id'],
    pixelEvents: ['PageView', 'ViewContent', 'Purchase']
  }
} as const;