import { z } from 'zod';

export const LeadScoringSchema = z.object({
  url: z.string().url(),
  businessInfo: z.object({
    industry: z.enum(['ecommerce', 'retail', 'saas', 'b2b', 'other']),
    revenue: z.object({
      monthly: z.number().min(0),
      yearly: z.number().min(0)
    }),
    employeeCount: z.object({
      marketing: z.number().min(0),
      sales: z.number().min(0),
      total: z.number().min(0)
    }),
    marketPosition: z.enum(['startup', 'challenger', 'leader', 'niche']),
    techStack: z.object({
      platforms: z.array(z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom'])),
      analytics: z.array(z.enum(['google-analytics', 'adobe-analytics', 'mixpanel', 'segment', 'klaviyo', 'none'])),
      advertising: z.array(z.enum(['google-ads', 'meta-ads', 'tiktok-ads', 'linkedin-ads', 'microsoft-ads', 'none'])),
      crm: z.enum(['hubspot', 'salesforce', 'pipedrive', 'zoho', 'freshworks', 'insightly', 'none', 'custom']),
      inventory: z.enum(['shopify', 'manual', 'erp', 'dropshipping', 'none'])
    }),
    painPoints: z.array(z.enum([
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
      'inaccurate-data'
    ])),
    budgetInfo: z.object({
      monthlyMarketing: z.number().min(0),
      monthlyAdSpend: z.number().min(0),
      budgetOwner: z.enum(['founder', 'cto', 'cmo', 'vp-marketing', 'agency']),
      budgetApproval: z.boolean(),
      decisionMaker: z.boolean(),
      decisionProcess: z.enum(['unanimous', 'consensus', 'individual', 'committee'])
    }),
    contactInfo: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      linkedin: z.string().url().optional(),
      title: z.string().optional(),
      decisionMaker: z.boolean()
    })
  }),
  adSpendAnalysis: z.array(z.object({
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
    lastImportDate: z.string().optional()
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

export type LeadScoring = z.infer<typeof LeadScoringSchema>;

export interface ScoringFactors {
  industry: {
    weight: number;
    scoreMultipliers: Record<string, number>;
  };
  revenue: {
    weight: number;
    thresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
  techStack: {
    weight: number;
    platformScoreMultipliers: Record<string, number>;
    compatibilityScoreMultipliers: Record<string, number>;
  };
  painPoints: {
    weight: number;
    painScoreMultipliers: Record<string, number>;
  };
  marketPosition: {
    weight: number;
    scoreMultipliers: Record<string, number>;
  };
  budgetInfo: {
    weight: number;
    budgetReadiness: {
      ready: number;
      needsApproval: number;
      lowBudget: number;
    };
  };
}

export interface ScoringResult {
  overallScore: number;
  category: 'hot' | 'warm' | 'cool' | 'cold';
  breakdown: {
    industry: number;
    revenue: number;
    techStack: number;
    painPoints: number;
    marketPosition: number;
    budgetReadiness: number;
    totalPossible: number;
  };
  recommendations: string[];
  redFlags: string[];
  idealCustomerProfile: {
    characteristics: string[];
    messaging: string[];
    approach: string[];
  };
}

export class LeadScorer {
  private factors: ScoringFactors = {
    industry: {
      weight: 15,
      scoreMultipliers: {
        'ecommerce': 1.0,
        'retail': 0.8,
        'saas': 1.1,
        'b2b': 0.9,
        'other': 0.5
      }
    },
    revenue: {
      weight: 25,
      thresholds: {
        high: 10000000,
        medium: 1000000,
        low: 100000
      }
    },
    techStack: {
      weight: 20,
      platformScoreMultipliers: {
        'shopify': 1.2,
        'woocommerce': 1.0,
        'magento': 0.9,
        'bigcommerce': 1.1,
        'custom': 0.7
      },
      compatibilityScoreMultipliers: {
        'google-analytics': 1.0,
        'adobe-analytics': 0.9,
        'mixpanel': 0.8,
        'segment': 0.9,
        'klaviyo': 1.1,
        'none': 0.3
      }
    },
    painPoints: {
      weight: 15,
      painScoreMultipliers: {
        'no-conversion-tracking': 2.0,
        'manual-bid-management': 1.8,
        'poor-attribution': 2.0,
        'high-ad-spend': 1.5,
        'low-traffic': 1.2,
        'technical-debt': 1.0,
        'customer-service-issues': 0.8,
        'inventory-management': 0.7,
        'low-margins': 1.3,
        'competition-increased': 1.1,
        'inaccurate-data': 1.9
      }
    },
    marketPosition: {
      weight: 10,
      scoreMultipliers: {
        'startup': 0.7,
        'challenger': 1.0,
        'leader': 1.2,
        'niche': 0.9
      }
    },
    budgetInfo: {
      weight: 15,
      budgetReadiness: {
        ready: 1.5,
        needsApproval: 0.5,
        lowBudget: 0.2
      }
    }
  };

  calculateScore(leadData: LeadScoring, factors?: Partial<ScoringFactors>): ScoringResult {
    const breakdown = this.calculateBreakdown(leadData, factors);
    const overallScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const category = this.determineCategory(overallScore);
    const recommendations = this.generateRecommendations(leadData, breakdown);
    const redFlags = this.identifyRedFlags(leadData, breakdown);
    const idealProfile = this.generateIdealProfile(leadData, breakdown);

    return {
      overallScore,
      category,
      breakdown,
      recommendations,
      redFlags,
      idealCustomerProfile: idealProfile
    };
  }

  private calculateBreakdown(leadData: LeadScoring, factors?: Partial<ScoringFactors>) {
    const f = { ...this.factors, ...factors };
    
    const industryScore = f.industry.scoreMultipliers[leadData.businessInfo.industry] * f.industry.weight;

    const yearlyRevenue = leadData.businessInfo.revenue.yearly || leadData.businessInfo.revenue.monthly * 12;
    let revenueScore = 0;
    if (yearlyRevenue >= f.revenue.thresholds.high) {
      revenueScore = f.revenue.weight;
    } else if (yearlyRevenue >= f.revenue.thresholds.medium) {
      revenueScore = f.revenue.weight * 0.75;
    } else if (yearlyRevenue >= f.revenue.thresholds.low) {
      revenueScore = f.revenue.weight * 0.5;
    }

    let techStackScore = 0;
    leadData.businessInfo.techStack.platforms.forEach(platform => {
      techStackScore += f.techStack.platformScoreMultipliers[platform] || 0.5;
    });
    
    let compatibilityScore = 0;
    leadData.businessInfo.techStack.analytics.forEach(analytic => {
      compatibilityScore += f.techStack.compatibilityScoreMultipliers[analytic] || 0.5;
    });
    
    const totalTechScore = (techStackScore + compatibilityScore) * 0.5;

    let painPointsScore = 0;
    leadData.businessInfo.painPoints.forEach(painPoint => {
      painPointsScore += f.painPoints.painScoreMultipliers[painPoint] || 0.5;
    });

    const marketPositionScore = f.marketPosition.scoreMultipliers[leadData.businessInfo.marketPosition] * f.marketPosition.weight;

    let budgetReadinessScore = 0;
    if (leadData.budgetInfo.decisionMaker && leadData.budgetInfo.budgetApproval) {
      budgetReadinessScore = f.budgetInfo.weight * f.budgetInfo.budgetReadiness.ready;
    } else if (leadData.budgetInfo.budgetApproval) {
      budgetReadinessScore = f.budgetInfo.weight * f.budgetInfo.budgetReadiness.needsApproval;
    } else {
      budgetReadinessScore = f.budgetInfo.weight * f.budgetInfo.budgetReadiness.lowBudget;
    }

    const totalPossible = 
      f.industry.weight + 
      f.revenue.weight + 
      f.techStack.weight + 
      f.painPoints.weight + 
      f.marketPosition.weight + 
      f.budgetInfo.weight;

    return {
      industry: industryScore,
      revenue: revenueScore,
      techStack: totalTechScore,
      painPoints: Math.min(painPointsScore, f.painPoints.weight),
      marketPosition: marketPositionScore,
      budgetReadiness: budgetReadinessScore,
      totalPossible
    };
  }

  private determineCategory(score: number): 'hot' | 'warm' | 'cool' | 'cold' {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cool';
    return 'cold';
  }

  private generateRecommendations(leadData: LeadScoring, breakdown: any): string[] {
    const recommendations: string[] = [];

    if (breakdown.techStack < 15) {
      recommendations.push('Focus on demonstrating platform compatibility and easy integration');
    }

    if (breakdown.painPoints < 10) {
      recommendations.push('Highlight waste reduction and ROI benefits');
    }

    if (breakdown.budgetReadiness < 10) {
      recommendations.push('Offer pilot program or flexible pricing');
    }

    if (leadData.businessInfo.industry === 'ecommerce') {
      recommendations.push('Emphasize e-commerce specific features and success stories');
    }

    if (leadData.businessInfo.marketPosition === 'startup') {
      recommendations.push('Focus on growth and scalability benefits');
    }

    return recommendations;
  }

  private identifyRedFlags(leadData: LeadScoring, breakdown: any): string[] {
    const redFlags: string[] = [];

    const yearlyRevenue = leadData.businessInfo.revenue.yearly || leadData.businessInfo.revenue.monthly * 12;
    const monthlyAdSpend = leadData.budgetInfo.monthlyAdSpend;

    if (monthlyAdSpend > yearlyRevenue * 0.2) {
      redFlags.push('High ad spend relative to revenue');
    }

    if (leadData.businessInfo.techStack.platforms.includes('custom') && leadData.businessInfo.employeeCount.total < 20) {
      redFlags.push('Custom platform with limited team resources');
    }

    if (!leadData.budgetInfo.decisionMaker) {
      redFlags.push('Contact person is not decision maker');
    }

    if (leadData.attribution.model === 'none' && monthlyAdSpend > 10000) {
      redFlags.push('High ad spend with no attribution tracking');
    }

    return redFlags;
  }

  private generateIdealProfile(leadData: LeadScoring, breakdown: any) {
    const characteristics: string[] = [];
    const messaging: string[] = [];
    const approach: string[] = [];

    if (breakdown.revenue > 20) {
      characteristics.push('High revenue business');
      messaging.push('Enterprise-grade solution for your scale');
    }

    if (leadData.businessInfo.industry === 'ecommerce') {
      characteristics.push('E-commerce business');
      messaging.push('Specialized for e-commerce attribution');
    }

    if (leadData.businessInfo.painPoints.includes('poor-attribution')) {
      characteristics.push('Attribution challenges');
      messaging.push('End guesswork with accurate attribution');
    }

    if (leadData.budgetInfo.decisionMaker) {
      approach.push('Direct decision-maker outreach');
      approach.push('Executive-focused value proposition');
    } else {
      approach.push('Champion building strategy');
      approach.push('Provide materials for internal presentation');
    }

    if (leadData.businessInfo.marketPosition === 'leader') {
      approach.push('Focus on competitive advantage');
      approach.push('Emphasize market leadership features');
    }

    return {
      characteristics,
      messaging,
      approach
    };
  }

  getFactors() {
    return this.factors;
  }
}