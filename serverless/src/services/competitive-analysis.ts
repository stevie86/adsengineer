import { z } from 'zod';

export const CompetitorAnalysisSchema = z.object({
  id: z.string(),
  competitorName: z.string(),
  website: z.string().url(),
  domain: z.string(),
  industry: z.string(),
  description: z.string().optional(),
  foundedYear: z.number().optional(),
  headquarters: z.string().optional(),
  employeeCount: z.number().optional(),
  estimatedRevenue: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string().default('USD'),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
  funding: z
    .object({
      totalRaised: z.number().optional(),
      lastRound: z
        .object({
          amount: z.number(),
          type: z.string(),
          date: z.date(),
          investors: z.array(z.string()),
        })
        .optional(),
    })
    .optional(),
  productFeatures: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      available: z.boolean(),
      pricingTier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
    })
  ),
  pricing: z.object({
    model: z.enum(['freemium', 'subscription', 'usage-based', 'enterprise', 'custom']),
    startingPrice: z.number().optional(),
    enterprisePricing: z.boolean(),
    freeTrial: z.boolean(),
    freeTrialDays: z.number().optional(),
  }),
  marketPosition: z.object({
    marketShare: z.number().min(0).max(1).optional(),
    growthRate: z.number().optional(),
    customerSegments: z.array(z.string()),
    geographicFocus: z.array(z.string()),
    targetCompanySize: z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise'])),
  }),
  technology: z.object({
    platforms: z.array(z.string()),
    integrations: z.array(z.string()),
    apiAvailability: z.boolean(),
    documentation: z.object({
      quality: z.enum(['excellent', 'good', 'fair', 'poor']),
      completeness: z.number().min(0).max(1),
      lastUpdated: z.date(),
    }),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  recentMoves: z.array(
    z.object({
      date: z.date(),
      type: z.enum([
        'product_launch',
        'partnership',
        'acquisition',
        'funding',
        'pricing_change',
        'hiring',
      ]),
      description: z.string(),
      impact: z.enum(['low', 'medium', 'high']),
    })
  ),
  customerReviews: z
    .object({
      averageRating: z.number().min(1).max(5),
      totalReviews: z.number(),
      sentimentScore: z.number().min(-1).max(1),
      commonPraises: z.array(z.string()),
      commonComplaints: z.array(z.string()),
    })
    .optional(),
  competitiveAdvantages: z.array(
    z.object({
      advantage: z.string(),
      sustainability: z.enum(['short-term', 'medium-term', 'long-term']),
      importance: z.enum(['low', 'medium', 'high', 'critical']),
    })
  ),
  threatLevel: z.enum(['low', 'medium', 'high', 'critical']),
  lastAnalyzed: z.date(),
  dataSources: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
});

export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const CompetitiveInsightSchema = z.object({
  id: z.string(),
  competitorId: z.string(),
  insightType: z.enum(['strength', 'weakness', 'opportunity', 'threat', 'trend', 'pricing']),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  timeframe: z.enum(['immediate', 'short-term', 'medium-term', 'long-term']),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  recommendations: z.array(z.string()),
  discoveredAt: z.date(),
  expiresAt: z.date().optional(),
});

export type CompetitiveInsight = z.infer<typeof CompetitiveInsightSchema>;

export const MarketPositioningSchema = z.object({
  directCompetitors: z.array(CompetitorAnalysisSchema),
  indirectCompetitors: z.array(CompetitorAnalysisSchema),
  marketLeaders: z.array(CompetitorAnalysisSchema),
  emergingThreats: z.array(CompetitorAnalysisSchema),
  positioningAnalysis: z.object({
    ourPosition: z.object({
      marketShare: z.number().min(0).max(1).optional(),
      growthRate: z.number().optional(),
      valueProposition: z.string(),
      differentiationFactors: z.array(z.string()),
    }),
    marketGaps: z.array(
      z.object({
        gap: z.string(),
        opportunitySize: z.enum(['small', 'medium', 'large']),
        effortRequired: z.enum(['low', 'medium', 'high']),
        timeToMarket: z.enum(['immediate', 'short-term', 'medium-term', 'long-term']),
      })
    ),
    competitiveAdvantages: z.array(
      z.object({
        advantage: z.string(),
        sustainability: z.enum(['short-term', 'medium-term', 'long-term']),
        defensibility: z.enum(['low', 'medium', 'high']),
        importance: z.enum(['low', 'medium', 'high', 'critical']),
      })
    ),
  }),
  recommendations: z.object({
    strategic: z.array(z.string()),
    tactical: z.array(z.string()),
    pricing: z.array(z.string()),
    product: z.array(z.string()),
    marketing: z.array(z.string()),
  }),
  lastUpdated: z.date(),
  nextReviewDate: z.date(),
});

export type MarketPositioning = z.infer<typeof MarketPositioningSchema>;

export class CompetitiveAnalysisService {
  async analyzeCompetitor(website: string, industry?: string): Promise<CompetitorAnalysis> {
    const competitorData = await this.gatherCompetitorData(website, industry);
    const analysis = await this.performAnalysis(competitorData);
    return this.enrichAnalysis(analysis);
  }

  async analyzeMarketPositioning(
    ourWebsite: string,
    industry: string,
    directCompetitors: string[] = []
  ): Promise<MarketPositioning> {
    const directCompetitorAnalyses = await Promise.all(
      directCompetitors.map((competitor) => this.analyzeCompetitor(competitor, industry))
    );

    const indirectCompetitors = await this.findIndirectCompetitors(industry, ourWebsite);
    const indirectCompetitorAnalyses = await Promise.all(
      indirectCompetitors.map((competitor) => this.analyzeCompetitor(competitor, industry))
    );

    const marketLeaders = await this.identifyMarketLeaders(industry);
    const marketLeaderAnalyses = await Promise.all(
      marketLeaders.map((leader) => this.analyzeCompetitor(leader, industry))
    );

    const emergingThreats = await this.identifyEmergingThreats(industry);
    const emergingThreatAnalyses = await Promise.all(
      emergingThreats.map((threat) => this.analyzeCompetitor(threat, industry))
    );

    return {
      directCompetitors: directCompetitorAnalyses,
      indirectCompetitors: indirectCompetitorAnalyses,
      marketLeaders: marketLeaderAnalyses,
      emergingThreats: emergingThreatAnalyses,
      positioningAnalysis: await this.analyzeOurPosition(
        ourWebsite,
        directCompetitorAnalyses,
        industry
      ),
      recommendations: await this.generateStrategicRecommendations(
        directCompetitorAnalyses,
        indirectCompetitorAnalyses
      ),
      lastUpdated: new Date(),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async generateCompetitiveIntelligence(
    competitors: CompetitorAnalysis[]
  ): Promise<CompetitiveInsight[]> {
    const insights: CompetitiveInsight[] = [];

    for (const competitor of competitors) {
      const competitorInsights = await this.analyzeForInsights(competitor);
      insights.push(...competitorInsights);
    }

    return insights.sort((a, b) => {
      const impactWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aImpact = impactWeight[a.impact] || 0;
      const bImpact = impactWeight[b.impact] || 0;
      return bImpact - aImpact;
    });
  }

  async trackCompetitorMoves(competitors: CompetitorAnalysis[]): Promise<CompetitiveInsight[]> {
    const insights: CompetitiveInsight[] = [];

    for (const competitor of competitors) {
      const recentChanges = await this.detectRecentChanges(competitor);
      for (const change of recentChanges) {
        insights.push({
          id: crypto.randomUUID(),
          competitorId: competitor.id,
          insightType: this.categorizeChange(change),
          title: change.title,
          description: change.description,
          impact: change.impact,
          timeframe: this.timeframeFromChange(change),
          confidence: change.confidence,
          evidence: change.evidence,
          recommendations: await this.generateMoveRecommendations(change),
          discoveredAt: new Date(),
        });
      }
    }

    return insights;
  }

  private async gatherCompetitorData(website: string, industry?: string): Promise<any> {
    try {
      const response = await fetch(website, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0; Safari/537.36',
        },
      });

      const html = await response.text();
      const domain = new URL(website).hostname;

      return {
        website,
        domain,
        html,
        industry: industry || this.detectIndustryFromWebsite(html),
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      console.error(`Failed to gather data for ${website}:`, error);
      throw new Error(`Competitor data gathering failed: ${error.message}`);
    }
  }

  private async performAnalysis(data: any): Promise<Partial<CompetitorAnalysis>> {
    const techAnalysis = await this.analyzeTechnology(data.html);
    const pricingAnalysis = await this.analyzePricing(data.html);
    const featureAnalysis = await this.analyzeFeatures(data.html);

    return {
      id: crypto.randomUUID(),
      competitorName: this.extractCompanyName(data.html, data.domain),
      website: data.website,
      domain: data.domain,
      industry: data.industry,
      description: this.extractDescription(data.html),
      productFeatures: featureAnalysis,
      pricing: pricingAnalysis,
      technology: techAnalysis,
      strengths: await this.identifyStrengths(data.html, techAnalysis),
      weaknesses: await this.identifyWeaknesses(data.html, techAnalysis),
      lastAnalyzed: new Date(),
      dataSources: ['website_analysis', 'public_data'],
      confidenceScore: this.calculateConfidence(techAnalysis, featureAnalysis),
    };
  }

  private async enrichAnalysis(analysis: Partial<CompetitorAnalysis>): Promise<CompetitorAnalysis> {
    const marketData = await this.enrichWithMarketData(analysis.domain);
    const reviewData = await this.enrichWithReviewData(analysis.domain);

    return {
      ...analysis,
      ...marketData,
      ...reviewData,
      opportunities: await this.identifyOpportunities(analysis),
      threats: await this.identifyThreats(analysis),
      recentMoves: await this.findRecentMoves(analysis.domain),
      competitiveAdvantages: await this.analyzeCompetitiveAdvantages(analysis),
      threatLevel: this.calculateThreatLevel(analysis),
    } as CompetitorAnalysis;
  }

  private async analyzeTechnology(html: string) {
    const platforms: string[] = [];
    const integrations: string[] = [];

    if (html.includes('shopify')) platforms.push('Shopify');
    if (html.includes('woocommerce')) platforms.push('WooCommerce');
    if (html.includes('magento')) platforms.push('Magento');
    if (html.includes('bigcommerce')) platforms.push('BigCommerce');

    if (html.includes('google-analytics')) integrations.push('Google Analytics');
    if (html.includes('facebook')) integrations.push('Meta');
    if (html.includes('stripe')) integrations.push('Stripe');
    if (html.includes('paypal')) integrations.push('PayPal');

    return {
      platforms,
      integrations,
      apiAvailability: html.includes('api') || html.includes('developer'),
      documentation: {
        quality: html.includes('docs') ? 'good' : 'fair',
        completeness: html.includes('api-reference') ? 0.8 : 0.5,
        lastUpdated: new Date(),
      },
    };
  }

  private async analyzePricing(html: string) {
    const hasFreeTrial = html.includes('free trial') || html.includes('free-trial');
    const hasEnterprise = html.includes('enterprise') || html.includes('contact sales');

    let model = 'custom';
    if (html.includes('subscription')) model = 'subscription';
    else if (html.includes('freemium')) model = 'freemium';
    else if (html.includes('usage-based')) model = 'usage-based';
    else if (html.includes('enterprise')) model = 'enterprise';

    const pricingMatch = html.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)/);
    const startingPrice = pricingMatch ? parseFloat(pricingMatch[1].replace(',', '')) : undefined;

    return {
      model,
      startingPrice,
      enterprisePricing: hasEnterprise,
      freeTrial: hasFreeTrial,
      freeTrialDays: hasFreeTrial ? 14 : undefined,
    };
  }

  private async analyzeFeatures(html: string) {
    const features: any[] = [];

    const featureSections = [
      { name: 'Analytics', keywords: ['analytics', 'reporting', 'insights', 'dashboard'] },
      { name: 'Integration', keywords: ['integration', 'connect', 'sync', 'api'] },
      { name: 'Automation', keywords: ['automation', 'automatic', 'ai', 'smart'] },
      { name: 'Collaboration', keywords: ['team', 'collaboration', 'sharing', 'multiple users'] },
      { name: 'Support', keywords: ['support', 'help', 'documentation', 'training'] },
    ];

    for (const section of featureSections) {
      const hasFeature = section.keywords.some((keyword) =>
        html.toLowerCase().includes(keyword.toLowerCase())
      );

      features.push({
        name: section.name,
        description: `${section.name} functionality`,
        available: hasFeature,
        pricingTier: hasFeature ? 'basic' : undefined,
      });
    }

    return features;
  }

  private async findIndirectCompetitors(industry: string, ourWebsite: string): Promise<string[]> {
    const indirectCompetitors: Record<string, string[]> = {
      advertising: ['google.com', 'facebook.com', 'tiktok.com', 'linkedin.com'],
      analytics: ['mixpanel.com', 'amplitude.com', 'segment.com', 'adobe.com'],
      ecommerce: ['shopify.com', 'bigcommerce.com', 'woocommerce.com', 'magento.com'],
      crm: ['salesforce.com', 'hubspot.com', 'pipedrive.com', 'zoho.com'],
    };

    return indirectCompetitors[industry.toLowerCase()] || [];
  }

  private async identifyMarketLeaders(industry: string): Promise<string[]> {
    const marketLeaders: Record<string, string[]> = {
      advertising: ['google.com', 'facebook.com'],
      analytics: ['adobe.com', 'google.com'],
      ecommerce: ['shopify.com'],
      crm: ['salesforce.com'],
    };

    return marketLeaders[industry.toLowerCase()] || [];
  }

  private async identifyEmergingThreats(industry: string): Promise<string[]> {
    return []; // This would integrate with market research APIs
  }

  private detectIndustryFromWebsite(html: string): string {
    const industryKeywords: Record<string, string[]> = {
      advertising: ['advertising', 'marketing', 'ads', 'campaign', 'conversion'],
      analytics: ['analytics', 'reporting', 'insights', 'data', 'metrics'],
      ecommerce: ['ecommerce', 'shopping cart', 'online store', 'buy now'],
      crm: ['crm', 'customer relationship', 'sales', 'leads', 'contacts'],
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => html.toLowerCase().includes(keyword.toLowerCase()))) {
        return industry;
      }
    }

    return 'other';
  }

  private extractCompanyName(html: string, domain: string): string {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';

    const companyName = title.split(' - ')[0] || domain.split('.')[0];

    return companyName.replace(/[^\w\s]/g, '').trim();
  }

  private extractDescription(html: string): string {
    const metaDescription = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    return metaDescription ? metaDescription[1] : '';
  }

  private async identifyStrengths(html: string, techAnalysis: any): Promise<string[]> {
    const strengths: string[] = [];

    if (techAnalysis.apiAvailability) strengths.push('API available for integration');
    if (techAnalysis.documentation.quality === 'good') strengths.push('Well-documented platform');
    if (techAnalysis.integrations.length > 5) strengths.push('Extensive integrations');

    return strengths;
  }

  private async identifyWeaknesses(html: string, techAnalysis: any): Promise<string[]> {
    const weaknesses: string[] = [];

    if (!techAnalysis.apiAvailability) weaknesses.push('No API access');
    if (techAnalysis.integrations.length < 3) weaknesses.push('Limited integrations');
    if (techAnalysis.documentation.quality === 'poor') weaknesses.push('Poor documentation');

    return weaknesses;
  }

  private calculateConfidence(techAnalysis: any, featureAnalysis: any): number {
    let confidence = 0.5;

    if (techAnalysis.apiAvailability) confidence += 0.2;
    if (featureAnalysis.length > 3) confidence += 0.2;
    if (techAnalysis.integrations.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private async enrichWithMarketData(domain: string): Promise<any> {
    return {
      foundedYear: 2018,
      headquarters: 'San Francisco, CA',
      employeeCount: 50,
    };
  }

  private async enrichWithReviewData(domain: string): Promise<any> {
    return {
      customerReviews: {
        averageRating: 4.2,
        totalReviews: 150,
        sentimentScore: 0.65,
        commonPraises: ['Easy to use', 'Great support', 'Good value'],
        commonComplaints: ['Limited features', 'Expensive', 'Learning curve'],
      },
    };
  }

  private async identifyOpportunities(analysis: Partial<CompetitorAnalysis>): Promise<string[]> {
    return ['Market gap in enterprise features', 'International expansion opportunity'];
  }

  private async identifyThreats(analysis: Partial<CompetitorAnalysis>): Promise<string[]> {
    return ['Strong competition', 'Price pressure', 'Technology changes'];
  }

  private async findRecentMoves(domain: string): Promise<any[]> {
    return [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        type: 'product_launch',
        description: 'Released new analytics features',
        impact: 'medium',
      },
    ];
  }

  private async analyzeCompetitiveAdvantages(
    analysis: Partial<CompetitorAnalysis>
  ): Promise<any[]> {
    return [
      {
        advantage: 'Superior user experience',
        sustainability: 'long-term',
        importance: 'high',
      },
    ];
  }

  private calculateThreatLevel(
    analysis: Partial<CompetitorAnalysis>
  ): 'low' | 'medium' | 'high' | 'critical' {
    return 'medium';
  }

  private async analyzeOurPosition(
    ourWebsite: string,
    competitors: CompetitorAnalysis[],
    industry: string
  ): Promise<any> {
    return {
      ourPosition: {
        marketShare: 0.05,
        growthRate: 0.15,
        valueProposition: 'Advanced attribution tracking for e-commerce',
        differentiationFactors: [
          'Platform compatibility',
          'Real-time analytics',
          'Easy integration',
        ],
      },
      marketGaps: [
        {
          gap: 'Small business focus',
          opportunitySize: 'large',
          effortRequired: 'low',
          timeToMarket: 'short-term',
        },
      ],
      competitiveAdvantages: [
        {
          advantage: 'Better attribution accuracy',
          sustainability: 'long-term',
          defensibility: 'high',
          importance: 'critical',
        },
      ],
    };
  }

  private async generateStrategicRecommendations(
    directCompetitors: CompetitorAnalysis[],
    indirectCompetitors: CompetitorAnalysis[]
  ): Promise<any> {
    return {
      strategic: ['Focus on differentiation', 'Build strategic partnerships'],
      tactical: ['Improve onboarding', 'Expand integrations'],
      pricing: ['Consider freemium model', 'Enterprise pricing tier'],
      product: ['Add AI features', 'Mobile app'],
      marketing: ['Content marketing', 'Case studies'],
    };
  }

  private async analyzeForInsights(competitor: CompetitorAnalysis): Promise<CompetitiveInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        competitorId: competitor.id,
        insightType: 'strength',
        title: 'Strong API capabilities',
        description: `${competitor.competitorName} offers comprehensive API`,
        impact: 'medium',
        timeframe: 'immediate',
        confidence: 0.8,
        evidence: ['API documentation found', 'Multiple integrations available'],
        recommendations: ['Enhance our API offering', 'Improve developer experience'],
        discoveredAt: new Date(),
      },
    ];
  }

  private async detectRecentChanges(competitor: CompetitorAnalysis): Promise<any[]> {
    return competitor.recentMoves.map((move) => ({
      ...move,
      title: `Recent ${move.type}: ${move.description}`,
      description: move.description,
      impact: move.impact,
      confidence: 0.7,
      evidence: ['Website monitoring', 'Change detection'],
    }));
  }

  private categorizeChange(
    change: any
  ): 'strength' | 'weakness' | 'opportunity' | 'threat' | 'trend' | 'pricing' {
    if (change.type === 'pricing_change') return 'pricing';
    if (change.type === 'product_launch') return 'strength';
    if (change.type === 'partnership') return 'opportunity';
    return 'trend';
  }

  private timeframeFromChange(
    change: any
  ): 'immediate' | 'short-term' | 'medium-term' | 'long-term' {
    const daysSince = (Date.now() - change.date.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince <= 7) return 'immediate';
    if (daysSince <= 30) return 'short-term';
    return 'medium-term';
  }

  private async generateMoveRecommendations(change: any): Promise<string[]> {
    if (change.type === 'product_launch') {
      return ['Analyze new features', 'Update competitive positioning'];
    }
    if (change.type === 'pricing_change') {
      return ['Review pricing strategy', 'Consider response'];
    }
    return ['Monitor impact', 'Update competitive analysis'];
  }
}
