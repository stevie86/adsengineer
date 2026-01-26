import { z } from 'zod';
import { PlatformDetectionResult, TechnologyAnalysisResult } from './tech-analyzer';

/**
 * Market Research Schemas
 */

export const MarketResearchQuerySchema = z.object({
  criteria: z.object({
    industries: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    minRevenue: z.number().optional(),
    maxRevenue: z.number().optional(),
    employeeRange: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    technologies: z.array(z.string()).optional(),
    platforms: z
      .array(z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom']))
      .optional(),
    adSpendRange: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
  }),
  filters: z
    .object({
      excludeCompetitors: z.boolean().default(true),
      excludeExistingCustomers: z.boolean().default(true),
      highGrowthOnly: z.boolean().default(false),
      wasteScoreThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().min(1).max(500).default(50),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['relevance', 'revenue', 'growth', 'wasteScore']).default('relevance'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
});

export type MarketResearchQuery = z.infer<typeof MarketResearchQuerySchema>;

export const MarketOpportunitySchema = z.object({
  id: z.string(),
  companyName: z.string(),
  website: z.string().url(),
  description: z.string().optional(),
  industry: z.string(),
  region: z.string(),
  foundedYear: z.number().optional(),
  employeeCount: z.number().optional(),
  estimatedRevenue: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD'),
    confidence: z.number().min(0).max(1),
  }),
  technology: z.object({
    platform: PlatformDetectionResult,
    analytics: z.array(z.string()),
    advertising: z.array(z.string()),
    integrations: z.array(z.string()),
  }),
  marketPosition: z.object({
    competitionLevel: z.enum(['low', 'medium', 'high']),
    growthRate: z.number().optional(),
    marketShare: z.number().optional(),
  }),
  adSpendAnalysis: z.object({
    estimatedMonthlySpend: z.object({
      min: z.number(),
      max: z.number(),
      currency: z.string().default('USD'),
    }),
    platforms: z.array(z.enum(['google', 'meta', 'tiktok', 'linkedin', 'pinterest'])),
    efficiency: z.number().min(0).max(1),
    wasteScore: z.number().min(0).max(100),
  }),
  opportunityScore: z.number().min(0).max(100),
  readinessSignals: z.array(
    z.enum(['hiring', 'funding', 'expansion', 'productLaunch', 'partnership'])
  ),
  riskFactors: z.array(
    z.enum(['highCompetition', 'technicalDebt', 'lowBudget', 'saturatedMarket'])
  ),
  lastUpdated: z.date(),
  dataSources: z.array(z.string()),
});

export type MarketOpportunity = z.infer<typeof MarketOpportunitySchema>;

export const MarketInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['trend', 'opportunity', 'threat', 'competitive']),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  timeframe: z.enum(['immediate', 'short-term', 'medium-term', 'long-term']),
  affectedIndustries: z.array(z.string()),
  affectedRegions: z.array(z.string()),
  data: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

export type MarketInsight = z.infer<typeof MarketInsightSchema>;

export const CompetitorAnalysisSchema = z.object({
  id: z.string(),
  competitorName: z.string(),
  website: z.string().url(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  marketShare: z.number().optional(),
  pricingStrategy: z.enum(['premium', 'mid-range', 'budget', 'freemium']),
  targetSegments: z.array(z.string()),
  recentMoves: z.array(z.string()),
  threatLevel: z.enum(['low', 'medium', 'high']),
  lastAnalyzed: z.date(),
});

export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const MarketResearchResultSchema = z.object({
  opportunities: z.array(MarketOpportunitySchema),
  insights: z.array(MarketInsightSchema),
  competitors: z.array(CompetitorAnalysisSchema),
  summary: z.object({
    totalOpportunities: z.number(),
    highValueOpportunities: z.number(),
    averageOpportunityScore: z.number(),
    topIndustries: z.array(
      z.object({
        industry: z.string(),
        count: z.number(),
        averageScore: z.number(),
      })
    ),
    keyInsights: z.array(z.string()),
  }),
  query: MarketResearchQuerySchema,
  generatedAt: z.date(),
  processingTime: z.number(),
});

export type MarketResearchResult = z.infer<typeof MarketResearchResultSchema>;

/**
 * Shopify Store Discovery Schemas
 */

export const ShopifyDiscoveryCriteriaSchema = z.object({
  keywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  minProducts: z.number().min(1).optional(),
  hasReviews: z.boolean().default(true),
  minReviewScore: z.number().min(1).max(5).optional(),
  activeRecently: z.boolean().default(true),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export type ShopifyDiscoveryCriteria = z.infer<typeof ShopifyDiscoveryCriteriaSchema>;

export const ShopifyStoreAnalysisSchema = z.object({
  storeUrl: z.string().url(),
  storeName: z.string(),
  description: z.string().optional(),
  products: z.array(
    z.object({
      title: z.string(),
      price: z.number(),
      currency: z.string(),
      category: z.string(),
      images: z.array(z.string().url()),
    })
  ),
  storeMetrics: z.object({
    totalProducts: z.number(),
    averagePrice: z.number(),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    reviewCount: z.number().optional(),
    averageRating: z.number().optional(),
    lastUpdated: z.date(),
  }),
  technology: z.object({
    theme: z.string(),
    apps: z.array(z.string()),
    customizations: z.array(z.string()),
  }),
  businessSignals: z.object({
    aboutUs: z.string().optional(),
    contactInfo: z
      .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    socialMedia: z.record(z.string().url()),
    shipping: z.object({
      freeShippingThreshold: z.number().optional(),
      internationalShipping: z.boolean(),
    }),
    policies: z.object({
      returns: z.string().optional(),
      privacy: z.string().optional(),
      terms: z.string().optional(),
    }),
  }),
  estimatedMetrics: z.object({
    monthlyVisitors: z.object({
      min: z.number(),
      max: z.number(),
    }),
    monthlyRevenue: z.object({
      min: z.number(),
      max: z.number(),
    }),
    conversionRate: z.number().min(0).max(1).optional(),
  }),
  opportunityScore: z.number().min(0).max(100),
  analysisDate: z.date(),
});

export type ShopifyStoreAnalysis = z.infer<typeof ShopifyStoreAnalysisSchema>;

/**
 * API Response Schemas
 */

export const MarketResearchResponseSchema = z.object({
  success: z.boolean(),
  data: MarketResearchResultSchema,
  metadata: z.object({
    requestId: z.string(),
    processingTime: z.number(),
    dataSourceCount: z.number(),
    cacheHit: z.boolean(),
  }),
});

export type MarketResearchResponse = z.infer<typeof MarketResearchResponseSchema>;

export const ShopifyDiscoveryResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    stores: z.array(ShopifyStoreAnalysisSchema),
    totalFound: z.number(),
    searchCriteria: ShopifyDiscoveryCriteriaSchema,
    searchTime: z.number(),
  }),
  metadata: z.object({
    requestId: z.string(),
    searchEngine: z.string(),
    resultPage: z.number(),
    totalPages: z.number(),
  }),
});

export type ShopifyDiscoveryResponse = z.infer<typeof ShopifyDiscoveryResponseSchema>;
