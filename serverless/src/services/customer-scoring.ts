import { z } from 'zod';

export const CustomerScoringSchema = z.object({
  source: z.enum([
    'outreach',
    'referral',
    'inbound',
    'website-visit',
    'demo-request',
    'trade-show',
    'cold-email',
    'partner-referral',
  ]),
  websiteUrl: z.string().url(),
  contactInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string(),
    title: z.string().optional(),
    linkedin: z.string().url().optional(),
    decisionMaker: z.boolean(),
  }),
  techStack: z.object({
    platforms: z.array(z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom'])),
    analytics: z.array(
      z.enum(['google-analytics', 'adobe-analytics', 'mixpanel', 'segment', 'klaviyo', 'none'])
    ),
    advertising: z.array(
      z.enum(['google-ads', 'meta-ads', 'tiktok-ads', 'linkedin-ads', 'microsoft-ads', 'none'])
    ),
    crm: z.array(
      z.enum([
        'hubspot',
        'salesforce',
        'pipedrive',
        'zoho',
        'freshworks',
        'insightly',
        'none',
        'custom',
      ])
    ),
    inventory: z.array(z.enum(['shopify', 'manual', 'erp', 'dropshipping', 'none'])),
  }),
  outreach: z.object({
    channels: z.array(z.enum(['email', 'phone', 'linkedin', 'social', 'events', 'content'])),
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']),
    lastContact: z.string().optional(),
    engagementScore: z.number().min(0).max(100),
  }),
  budgetInfo: z.object({
    monthlyBudget: z.number().min(0),
    teamSize: z.number().min(1),
    decisionProcess: z.enum(['unanimous', 'consensus', 'individual', 'committee']),
    approvalRequired: z.boolean(),
    salesCycle: z.number().min(1),
  }),
  teamSize: z.object({
    marketing: z.number().min(0),
    sales: z.number().min(0),
    technical: z.number().min(0),
    customerSuccess: z.number().min(0),
    supportCapacity: z.number().min(0),
  }),
  revenue: z.object({
    monthly: z.number().min(0),
    yearly: z.number().min(0),
  }),
  marketPosition: z.enum(['startup', 'challenger', 'leader', 'niche']),
  painPoints: z.array(
    z.enum([
      'no-conversion-tracking',
      'manual-bid-management',
      'poor-attribution',
      'high-ad-spend',
      'low-traffic',
      'technical-debt',
      'customer-service-issues',
      'inventory-management',
      'low-margins',
      'competition-increased',
      'inaccurate-data',
    ])
  ),
  adSpendAnalysis: z.array(
    z.object({
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
    })
  ),
});

export type CustomerScoring = z.infer<typeof CustomerScoringSchema>;

export interface TechDetection {
  technology: string;
  confidence: number;
  evidence: string[];
  version?: string;
  details?: Record<string, any>;
}

export interface TechStackAnalysis {
  platform: TechDetection;
  analytics: TechDetection[];
  advertising: TechDetection[];
  crm: TechDetection[];
  ecommerce: TechDetection[];
  integration: TechDetection[];
  security: TechDetection[];
  performance: TechDetection[];
  overallConfidence: number;
}

export interface CustomerScoreFactors {
  source: {
    weight: number;
    scoreMultipliers: Record<string, number>;
  };
  techStack: {
    weight: number;
    platformScoreMultipliers: Record<string, number>;
    compatibilityScoreMultipliers: Record<string, number>;
  };
  revenue: {
    weight: number;
    thresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  budget: {
    weight: number;
    readinessScoreMultipliers: Record<string, number>;
  };
  teamSize: {
    weight: number;
    capacityThresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  engagement: {
    weight: number;
    engagementThresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  marketPosition: {
    weight: number;
    scoreMultipliers: Record<string, number>;
  };
  painPoints: {
    weight: number;
    painScoreMultipliers: Record<string, number>;
  };
}

export interface CustomerScoringResult {
  overallScore: number;
  category: 'hot-lead' | 'warm-lead' | 'cool-lead' | 'cold-lead';
  breakdown: {
    source: number;
    techStack: number;
    revenue: number;
    budget: number;
    teamSize: number;
    engagement: number;
    marketPosition: number;
    painPoints: number;
    totalPossible: number;
  };
  recommendations: string[];
  riskFactors: string[];
  acquisitionStrategy: {
    channels: string[];
    messaging: string[];
    timeline: string;
    budgetAllocation: string;
  };
  conversionProbability: {
    probability: number;
    confidence: number;
    factors: string[];
  };
}

export class CustomerScorer {
  private factors: CustomerScoreFactors = {
    source: {
      weight: 10,
      scoreMultipliers: {
        referral: 1.5,
        inbound: 1.3,
        'demo-request': 1.2,
        'website-visit': 1.0,
        'trade-show': 0.9,
        'partner-referral': 0.8,
        outreach: 0.7,
        'cold-email': 0.5,
      },
    },
    techStack: {
      weight: 20,
      platformScoreMultipliers: {
        shopify: 1.3,
        woocommerce: 1.0,
        magento: 0.9,
        bigcommerce: 1.1,
        custom: 0.6,
      },
      compatibilityScoreMultipliers: {
        'google-analytics': 1.0,
        'adobe-analytics': 0.9,
        mixpanel: 0.8,
        segment: 0.9,
        klaviyo: 1.2,
        none: 0.3,
      },
    },
    revenue: {
      weight: 25,
      thresholds: {
        high: 10000000,
        medium: 1000000,
        low: 100000,
      },
    },
    budget: {
      weight: 15,
      readinessScoreMultipliers: {
        individual: 1.5,
        consensus: 1.0,
        committee: 0.7,
        unanimous: 0.5,
      },
    },
    teamSize: {
      weight: 10,
      capacityThresholds: {
        high: 50,
        medium: 20,
        low: 5,
      },
    },
    engagement: {
      weight: 10,
      engagementThresholds: {
        high: 70,
        medium: 40,
        low: 20,
      },
    },
    marketPosition: {
      weight: 5,
      scoreMultipliers: {
        leader: 1.3,
        challenger: 1.0,
        niche: 0.9,
        startup: 0.7,
      },
    },
    painPoints: {
      weight: 5,
      painScoreMultipliers: {
        'no-conversion-tracking': 2.0,
        'poor-attribution': 2.0,
        'inaccurate-data': 1.8,
        'manual-bid-management': 1.5,
        'high-ad-spend': 1.3,
        'low-traffic': 1.1,
        'competition-increased': 1.0,
        'technical-debt': 0.9,
        'low-margins': 0.8,
        'inventory-management': 0.7,
        'customer-service-issues': 0.6,
      },
    },
  };

  calculateCustomerScore(
    customerData: CustomerScoring,
    factors?: Partial<CustomerScoreFactors>
  ): CustomerScoringResult {
    const breakdown = this.calculateBreakdown(customerData, factors);
    const overallScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const category = this.determineCategory(overallScore);
    const recommendations = this.generateRecommendations(customerData, breakdown);
    const riskFactors = this.identifyRiskFactors(customerData, breakdown);
    const acquisitionStrategy = this.generateAcquisitionStrategy(customerData, breakdown);
    const conversionProbability = this.calculateConversionProbability(customerData, breakdown);

    return {
      overallScore,
      category,
      breakdown,
      recommendations,
      riskFactors,
      acquisitionStrategy,
      conversionProbability,
    };
  }

  private calculateBreakdown(
    customerData: CustomerScoring,
    factors?: Partial<CustomerScoreFactors>
  ) {
    const f = { ...this.factors, ...factors };

    const sourceScore = f.source.scoreMultipliers[customerData.source] * f.source.weight;

    let techStackScore = 0;
    customerData.techStack.platforms.forEach((platform) => {
      techStackScore += f.techStack.platformScoreMultipliers[platform] || 0.5;
    });

    let compatibilityScore = 0;
    customerData.techStack.analytics.forEach((analytic) => {
      compatibilityScore += f.techStack.compatibilityScoreMultipliers[analytic] || 0.5;
    });

    const totalTechScore = (techStackScore + compatibilityScore) * 0.5;

    const yearlyRevenue = customerData.revenue.yearly || customerData.revenue.monthly * 12;
    let revenueScore = 0;
    if (yearlyRevenue >= f.revenue.thresholds.high) {
      revenueScore = f.revenue.weight;
    } else if (yearlyRevenue >= f.revenue.thresholds.medium) {
      revenueScore = f.revenue.weight * 0.75;
    } else if (yearlyRevenue >= f.revenue.thresholds.low) {
      revenueScore = f.revenue.weight * 0.5;
    }

    const budgetScore =
      f.budget.readinessScoreMultipliers[customerData.budgetInfo.decisionProcess] * f.budget.weight;

    const totalTeamSize = Object.values(customerData.teamSize).reduce((sum, size) => sum + size, 0);
    let teamSizeScore = 0;
    if (totalTeamSize >= f.teamSize.capacityThresholds.high) {
      teamSizeScore = f.teamSize.weight;
    } else if (totalTeamSize >= f.teamSize.capacityThresholds.medium) {
      teamSizeScore = f.teamSize.weight * 0.75;
    } else if (totalTeamSize >= f.teamSize.capacityThresholds.low) {
      teamSizeScore = f.teamSize.weight * 0.5;
    }

    let engagementScore = 0;
    if (customerData.outreach.engagementScore >= f.engagement.engagementThresholds.high) {
      engagementScore = f.engagement.weight;
    } else if (customerData.outreach.engagementScore >= f.engagement.engagementThresholds.medium) {
      engagementScore = f.engagement.weight * 0.75;
    } else if (customerData.outreach.engagementScore >= f.engagement.engagementThresholds.low) {
      engagementScore = f.engagement.weight * 0.5;
    }

    const marketPositionScore =
      f.marketPosition.scoreMultipliers[customerData.marketPosition] * f.marketPosition.weight;

    let painPointsScore = 0;
    customerData.painPoints.forEach((painPoint) => {
      painPointsScore += f.painPoints.painScoreMultipliers[painPoint] || 0.5;
    });

    const totalPossible =
      f.source.weight +
      f.techStack.weight +
      f.revenue.weight +
      f.budget.weight +
      f.teamSize.weight +
      f.engagement.weight +
      f.marketPosition.weight +
      f.painPoints.weight;

    return {
      source: sourceScore,
      techStack: totalTechScore,
      revenue: revenueScore,
      budget: budgetScore,
      teamSize: teamSizeScore,
      engagement: engagementScore,
      marketPosition: marketPositionScore,
      painPoints: Math.min(painPointsScore, f.painPoints.weight),
      totalPossible,
    };
  }

  private determineCategory(score: number): 'hot-lead' | 'warm-lead' | 'cool-lead' | 'cold-lead' {
    if (score >= 80) return 'hot-lead';
    if (score >= 60) return 'warm-lead';
    if (score >= 40) return 'cool-lead';
    return 'cold-lead';
  }

  private generateRecommendations(customerData: CustomerScoring, breakdown: any): string[] {
    const recommendations: string[] = [];

    if (breakdown.techStack < 15) {
      recommendations.push('Demonstrate platform compatibility and easy integration');
    }

    if (breakdown.engagement < 7) {
      recommendations.push('Increase outreach frequency and personalize messaging');
    }

    if (breakdown.budget < 10) {
      recommendations.push('Focus on ROI and build business case for stakeholders');
    }

    if (customerData.source === 'cold-email' && breakdown.revenue > 20) {
      recommendations.push('High-value cold lead - prioritize immediate follow-up');
    }

    if (customerData.painPoints.includes('no-conversion-tracking')) {
      recommendations.push('Emphasize conversion tracking capabilities');
    }

    return recommendations;
  }

  private identifyRiskFactors(customerData: CustomerScoring, breakdown: any): string[] {
    const riskFactors: string[] = [];

    if (customerData.budgetInfo.decisionProcess === 'unanimous') {
      riskFactors.push('Complex decision process - unanimous approval required');
    }

    if (customerData.budgetInfo.salesCycle > 90) {
      riskFactors.push('Long sales cycle - extended follow-up required');
    }

    if (
      customerData.techStack.platforms.includes('custom') &&
      customerData.teamSize.technical < 5
    ) {
      riskFactors.push('Custom platform with limited technical resources');
    }

    if (!customerData.contactInfo.decisionMaker) {
      riskFactors.push('Contact is not decision maker - need internal champion');
    }

    if (breakdown.engagement < 5) {
      riskFactors.push('Low engagement score - risk of disengagement');
    }

    return riskFactors;
  }

  private generateAcquisitionStrategy(customerData: CustomerScoring, breakdown: any) {
    const channels: string[] = [];
    const messaging: string[] = [];
    let timeline = '';
    let budgetAllocation = '';

    if (customerData.source === 'referral' || customerData.source === 'partner-referral') {
      channels.push('Leverage referral relationship');
      messaging.push('Warm introduction approach');
    }

    if (customerData.contactInfo.decisionMaker) {
      channels.push('Direct executive outreach');
      messaging.push('Business value and ROI focus');
    } else {
      channels.push('Multi-stakeholder engagement');
      messaging.push('Technical and business benefits');
    }

    if (breakdown.revenue > 20) {
      channels.push('Enterprise sales approach');
      messaging.push('Scalability and enterprise features');
      timeline = '90-120 days';
      budgetAllocation = 'High-touch, dedicated resources';
    } else {
      channels.push('Product-led growth');
      messaging.push('Quick implementation and fast ROI');
      timeline = '30-60 days';
      budgetAllocation = 'Automated nurture sequences';
    }

    if (customerData.painPoints.includes('poor-attribution')) {
      messaging.push('End attribution guesswork');
    }

    return {
      channels,
      messaging,
      timeline,
      budgetAllocation,
    };
  }

  private calculateConversionProbability(customerData: CustomerScoring, breakdown: any) {
    let probability = 0;
    const factors: string[] = [];

    if (customerData.contactInfo.decisionMaker) {
      probability += 0.25;
      factors.push('Decision maker engaged');
    }

    if (breakdown.revenue > 20) {
      probability += 0.2;
      factors.push('Strong revenue profile');
    }

    if (breakdown.techStack > 15) {
      probability += 0.2;
      factors.push('Technology compatibility');
    }

    if (
      customerData.painPoints.includes('no-conversion-tracking') ||
      customerData.painPoints.includes('poor-attribution')
    ) {
      probability += 0.15;
      factors.push('Clear pain points identified');
    }

    if (customerData.source === 'referral') {
      probability += 0.1;
      factors.push('Warm introduction');
    }

    if (breakdown.engagement > 7) {
      probability += 0.1;
      factors.push('High engagement score');
    }

    const confidence = Math.min(breakdown.engagement / 10, 1.0);

    return {
      probability: Math.min(probability, 1.0),
      confidence,
      factors,
    };
  }

  getFactors() {
    return this.factors;
  }
}
