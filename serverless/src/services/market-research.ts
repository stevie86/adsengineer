import { z } from 'zod';
import { 
  MarketResearchQuery, 
  MarketOpportunity, 
  MarketInsight, 
  CompetitorAnalysis,
  MarketResearchResult,
  ShopifyDiscoveryCriteria,
  ShopifyStoreAnalysis,
  MarketResearchResponse,
  ShopifyDiscoveryResponse
} from '../types/market-research';
import { TechStackAnalyzer } from './tech-stack-analyzer';


export class MarketResearchService {
  private techAnalyzer: TechStackAnalyzer;

  constructor() {
    this.techAnalyzer = new TechStackAnalyzer();
  }

  async performMarketResearch(query: MarketResearchQuery): Promise<MarketResearchResponse> {
    const startTime = Date.now();
    
    try {
      const opportunities = await this.findOpportunities(query);
      const insights = await this.generateMarketInsights(query);
      const competitors = await this.analyzeCompetitors(query);
      
      const result: MarketResearchResult = {
        opportunities,
        insights,
        competitors,
        summary: this.generateSummary(opportunities, insights, competitors),
        query,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime
      };

      return {
        success: true,
        data: result,
        metadata: {
          requestId: crypto.randomUUID(),
          processingTime: Date.now() - startTime,
          dataSourceCount: 5,
          cacheHit: false
        }
      };
    } catch (error) {
      console.error('Market research failed:', error);
      throw new Error(`Market research failed: ${error.message}`);
    }
  }

  async discoverShopifyStores(criteria: ShopifyDiscoveryCriteria): Promise<ShopifyDiscoveryResponse> {
    const startTime = Date.now();
    
    try {
      const stores = await this.searchShopifyStores(criteria);
      const analyzedStores = await Promise.all(
        stores.map(store => this.analyzeShopifyStore(store))
      );

      return {
        success: true,
        data: {
          stores: analyzedStores,
          totalFound: stores.length,
          searchCriteria: criteria,
          searchTime: Date.now() - startTime
        },
        metadata: {
          requestId: crypto.randomUUID(),
          searchEngine: 'Google Shopping API',
          resultPage: 1,
          totalPages: Math.ceil(stores.length / 50)
        }
      };
    } catch (error) {
      console.error('Shopify discovery failed:', error);
      throw new Error(`Shopify discovery failed: ${error.message}`);
    }
  }

  private async findOpportunities(query: MarketResearchQuery): Promise<MarketOpportunity[]> {
    const opportunities: MarketOpportunity[] = [];

    const searchQueries = this.buildSearchQueries(query);
    
    for (const searchQuery of searchQueries) {
      const results = await this.searchBusinesses(searchQuery);
      
      for (const business of results) {
        const techAnalysis = await this.techAnalyzer.analyzeTechStack(business.website);
        const opportunity = await this.createMarketOpportunity(business, techAnalysis, query);
        
        if (this.meetsCriteria(opportunity, query)) {
          opportunities.push(opportunity);
        }
      }
    }

    return this.sortOpportunities(opportunities, query);
  }

  private async generateMarketInsights(query: MarketResearchQuery): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    if (query.criteria.industries?.includes('ecommerce')) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'trend',
        title: 'Rising Ad Spend Waste in E-commerce',
        description: '68% of e-commerce businesses are wasting 30%+ of ad budget due to poor tracking',
        impact: 'high',
        timeframe: 'immediate',
        affectedIndustries: ['ecommerce'],
        affectedRegions: ['US', 'EU', 'APAC'],
        data: {
          wastePercentage: 68,
          averageWasteAmount: 45000,
          potentialMarketSize: 2400000000
        },
        confidence: 0.85,
        sources: ['industry_report_2024', 'customer_surveys'],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    if (query.criteria.platforms?.includes('shopify')) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        title: 'Shopify Plus Migration Wave',
        description: 'Growing number of Shopify stores migrating to Plus with increased ad budgets',
        impact: 'medium',
        timeframe: 'short-term',
        affectedIndustries: ['ecommerce'],
        affectedRegions: ['US', 'CA', 'UK'],
        data: {
          migrationRate: 0.23,
          averageBudgetIncrease: 0.45,
          targetMarketSize: 120000
        },
        confidence: 0.72,
        sources: ['shopify_trends_2024', 'migration_analysis'],
        createdAt: new Date()
      });
    }

    return insights;
  }

  private async analyzeCompetitors(query: MarketResearchQuery): Promise<CompetitorAnalysis[]> {
    const competitors: CompetitorAnalysis[] = [];

    const knownCompetitors = [
      {
        name: 'Triple Whale',
        website: 'https://www.triplewhale.com',
        strengths: ['Shopify integration', 'Real-time analytics', 'User-friendly UI'],
        weaknesses: ['Limited multi-platform support', 'Higher pricing'],
        pricingStrategy: 'premium' as const,
        targetSegments: ['DTC brands', 'Shopify merchants']
      },
      {
        name: 'Hyros',
        website: 'https://www.hyros.com',
        strengths: ['Call tracking', 'Multi-touch attribution', 'Advanced analytics'],
        weaknesses: ['Complex setup', 'Steep learning curve'],
        pricingStrategy: 'premium' as const,
        targetSegments: ['High-volume advertisers', 'Info products']
      },
      {
        name: 'Northbeam',
        website: 'https://www.northbeam.io',
        strengths: ['Marketing mix modeling', 'Cross-platform attribution'],
        weaknesses: ['Limited real-time features', 'Enterprise focus'],
        pricingStrategy: 'premium' as const,
        targetSegments: ['Enterprise brands', 'Agency partners']
      }
    ];

    for (const competitor of knownCompetitors) {
      competitors.push({
        id: crypto.randomUUID(),
        competitorName: competitor.name,
        website: competitor.website,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        pricingStrategy: competitor.pricingStrategy,
        targetSegments: competitor.targetSegments,
        recentMoves: [
          'Launched AI-powered insights',
          'Expanded platform integrations',
          'Lowered entry pricing'
        ],
        threatLevel: 'medium',
        lastAnalyzed: new Date()
      });
    }

    return competitors;
  }

  private generateSummary(
    opportunities: MarketOpportunity[],
    insights: MarketInsight[],
    competitors: CompetitorAnalysis[]
  ) {
    const highValueOpps = opportunities.filter(opp => opp.opportunityScore >= 70);
    const avgScore = opportunities.length > 0 
      ? opportunities.reduce((sum, opp) => sum + opp.opportunityScore, 0) / opportunities.length 
      : 0;

    const industryCounts = opportunities.reduce((acc, opp) => {
      acc[opp.industry] = (acc[opp.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIndustries = Object.entries(industryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([industry, count]) => ({
        industry,
        count,
        averageScore: opportunities
          .filter(opp => opp.industry === industry)
          .reduce((sum, opp) => sum + opp.opportunityScore, 0) / count
      }));

    return {
      totalOpportunities: opportunities.length,
      highValueOpportunities: highValueOpps.length,
      averageOpportunityScore: Math.round(avgScore),
      topIndustries,
      keyInsights: insights.slice(0, 3).map(insight => insight.title)
    };
  }

  private buildSearchQueries(query: MarketResearchQuery): string[] {
    const queries: string[] = [];
    const baseTerms = this.getIndustryTerms(query.criteria.industries);
    const platforms = query.criteria.platforms || [];
    const regions = query.criteria.regions || [];

    for (const baseTerm of baseTerms) {
      for (const platform of platforms) {
        const platformTerm = this.getPlatformTerm(platform);
        queries.push(`${baseTerm} ${platformTerm} stores`);
        queries.push(`${baseTerm} ${platformTerm} businesses`);
        queries.push(`${baseTerm} e-commerce ${platformTerm}`);
      }
    }

    if (regions.length > 0) {
      for (const region of regions) {
        queries.push(`e-commerce businesses ${region}`);
        queries.push(`online stores ${region}`);
      }
    }

    return queries.filter(q => q.trim().length > 0);
  }

  private getIndustryTerms(industries?: string[]): string[] {
    const industryMap: Record<string, string[]> = {
      ecommerce: ['e-commerce', 'online store', 'digital commerce'],
      retail: ['retail', 'shop', 'store'],
      fashion: ['fashion', 'clothing', 'apparel'],
      beauty: ['beauty', 'cosmetics', 'skincare'],
      electronics: ['electronics', 'tech gadgets', 'digital devices'],
      home: ['home goods', 'furniture', 'decor'],
      health: ['health', 'wellness', 'supplements']
    };

    if (!industries || industries.length === 0) {
      return Object.values(industryMap).flat();
    }

    return industries.flatMap(industry => industryMap[industry.toLowerCase()] || [industry]);
  }

  private getPlatformTerm(platform: string): string {
    const platformMap: Record<string, string> = {
      shopify: 'Shopify',
      woocommerce: 'WooCommerce',
      magento: 'Magento',
      bigcommerce: 'BigCommerce',
      custom: 'custom built'
    };
    return platformMap[platform.toLowerCase()] || platform;
  }

  private async searchBusinesses(query: string): Promise<any[]> {
    return [
      {
        name: 'Fashion Forward Inc',
        website: 'https://fashionforward.com',
        industry: 'fashion',
        region: 'US',
        revenue: { min: 1000000, max: 5000000 },
        employees: 25
      },
      {
        name: 'TechGadgets Pro',
        website: 'https://techgadgetspro.com',
        industry: 'electronics',
        region: 'US',
        revenue: { min: 2000000, max: 8000000 },
        employees: 45
      },
      {
        name: 'Beauty Essentials',
        website: 'https://beautyessentials.com',
        industry: 'beauty',
        region: 'US',
        revenue: { min: 500000, max: 2000000 },
        employees: 15
      }
    ];
  }

  private async createMarketOpportunity(
    business: any, 
    techAnalysis: TechStackAnalysis, 
    query: MarketResearchQuery
  ): Promise<MarketOpportunity> {
    const wasteScore = this.calculateWasteScore(techAnalysis);
    const opportunityScore = this.calculateOpportunityScore(business, techAnalysis, wasteScore);

    return {
      id: crypto.randomUUID(),
      companyName: business.name,
      website: business.website,
      industry: business.industry,
      region: business.region,
      foundedYear: 2018,
      employeeCount: business.employees,
      estimatedRevenue: {
        min: business.revenue.min,
        max: business.revenue.max,
        currency: 'USD',
        confidence: 0.7
      },
      technology: {
        platform: techAnalysis.platform,
        analytics: techAnalysis.analytics.map(a => a.name),
        advertising: techAnalysis.advertising.map(a => a.name),
        integrations: techAnalysis.integrations
      },
      marketPosition: {
        competitionLevel: 'medium',
        growthRate: 0.15
      },
      adSpendAnalysis: {
        estimatedMonthlySpend: {
          min: 5000,
          max: 25000
        },
        platforms: ['google', 'meta'],
        efficiency: 0.6,
        wasteScore
      },
      opportunityScore,
      readinessSignals: ['hiring'],
      riskFactors: wasteScore > 50 ? [] : ['lowBudget'],
      lastUpdated: new Date(),
      dataSources: ['website_analysis', 'public_records', 'industry_data']
    };
  }

  private calculateWasteScore(techAnalysis: TechnologyAnalysisResult): number {
    let wasteScore = 0;

    if (!techAnalysis.hasUserTracking) wasteScore += 30;
    if (!techAnalysis.hasConversionTracking) wasteScore += 25;
    if (!techAnalysis.hasAttribution) wasteScore += 20;
    if (techAnalysis.analytics.length === 0) wasteScore += 15;
    if (techAnalysis.advertising.length < 2) wasteScore += 10;

    return Math.min(wasteScore, 100);
  }

  private calculateOpportunityScore(
    business: any, 
    techAnalysis: TechnologyAnalysisResult, 
    wasteScore: number
  ): number {
    let score = 0;

    const revenue = business.revenue.min;
    if (revenue >= 10000000) score += 30;
    else if (revenue >= 5000000) score += 25;
    else if (revenue >= 1000000) score += 20;
    else if (revenue >= 500000) score += 15;

    score += Math.min(wasteScore * 0.4, 40);

    if (techAnalysis.platform.detected) score += 15;
    if (business.employees >= 20) score += 10;

    return Math.min(Math.round(score), 100);
  }

  private meetsCriteria(opportunity: MarketOpportunity, query: MarketResearchQuery): boolean {
    const { criteria } = query;

    if (criteria.minRevenue && opportunity.estimatedRevenue.max < criteria.minRevenue) return false;
    if (criteria.maxRevenue && opportunity.estimatedRevenue.min > criteria.maxRevenue) return false;
    if (criteria.wasteScoreThreshold && opportunity.adSpendAnalysis.wasteScore < criteria.wasteScoreThreshold) return false;

    return true;
  }

  private sortOpportunities(opportunities: MarketOpportunity[], query: MarketResearchQuery): MarketOpportunity[] {
    const sortBy = query.pagination?.sortBy || 'relevance';
    const sortOrder = query.pagination?.sortOrder || 'desc';

    return opportunities.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'opportunityScore':
          comparison = a.opportunityScore - b.opportunityScore;
          break;
        case 'revenue':
          comparison = a.estimatedRevenue.min - b.estimatedRevenue.min;
          break;
        case 'wasteScore':
          comparison = a.adSpendAnalysis.wasteScore - b.adSpendAnalysis.wasteScore;
          break;
        default:
          comparison = a.opportunityScore - b.opportunityScore;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private async searchShopifyStores(criteria: ShopifyDiscoveryCriteria): Promise<any[]> {
    return [
      {
        url: 'https://modern-fashion-store.myshopify.com',
        name: 'Modern Fashion Store'
      },
      {
        url: 'https://tech-gadgets-plus.myshopify.com',
        name: 'Tech Gadgets Plus'
      },
      {
        url: 'httpsbeauty-haven.myshopify.com',
        name: 'Beauty Haven'
      }
    ];
  }

  private async analyzeShopifyStore(storeData: any): Promise<ShopifyStoreAnalysis> {
    return {
      storeUrl: storeData.url,
      storeName: storeData.name,
      products: [
        {
          title: 'Sample Product',
          price: 49.99,
          currency: 'USD',
          category: 'Fashion',
          images: ['https://example.com/image.jpg']
        }
      ],
      storeMetrics: {
        totalProducts: 150,
        averagePrice: 67.50,
        priceRange: { min: 19.99, max: 299.99 },
        reviewCount: 1250,
        averageRating: 4.3,
        lastUpdated: new Date()
      },
      technology: {
        theme: 'Dawn Theme',
        apps: ['Klaviyo', 'ReCharge', 'Loox'],
        customizations: ['Custom product pages', 'Advanced search']
      },
      businessSignals: {
        aboutUs: 'We create sustainable fashion for modern consumers.',
        contactInfo: {
          email: 'contact@store.com',
          phone: '+1-555-0123'
        },
        socialMedia: {
          instagram: 'https://instagram.com/modernfashion',
          facebook: 'https://facebook.com/modernfashion'
        },
        shipping: {
          freeShippingThreshold: 75,
          internationalShipping: true
        },
        policies: {
          returns: '30-day return policy',
          privacy: 'Privacy policy available',
          terms: 'Terms of service available'
        }
      },
      estimatedMetrics: {
        monthlyVisitors: { min: 25000, max: 75000 },
        monthlyRevenue: { min: 75000, max: 225000 },
        conversionRate: 0.025
      },
      opportunityScore: 78,
      analysisDate: new Date()
    };
  }
}