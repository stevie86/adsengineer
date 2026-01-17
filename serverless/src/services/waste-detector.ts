import { AdSpendAnalysis, WasteAnalysis } from './ecommerce-analysis';

export interface WasteCategory {
  noTracking: number;
  wrongAttribution: number;
  poorTargeting: number;
  technicalIssues: number;
  invalidVersions: number;
  budgetDrift: number;
  fraud: number;
}

export interface WastePattern {
  type: 'no-tracking' | 'attribution-window' | 'targeting-mismatch' | 'technical-configuration';
  description: string;
  threshold: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  indicators: string[];
  fixComplexity: 'easy' | 'medium' | 'hard';
}

export class WasteDetector {
  private wastePatterns: WastePattern[] = [
    {
      type: 'no-tracking',
      description: 'No conversion tracking on high-value actions',
      threshold: 0.8,
      severity: 'critical',
      indicators: [
        'No purchase confirmation events',
        'Missing thank you page tracking',
        'No checkout funnel analysis',
        'No cart abandonment tracking'
      ],
      fixComplexity: 'medium'
    },
    {
      type: 'attribution-window',
      description: 'Incorrect conversion attribution window settings',
      threshold: 7,
      severity: 'high',
      indicators: [
        '90-day default attribution window',
        'No custom attribution by product type',
        'Missing post-view attribution',
        'No device cross-reference'
      ],
      fixComplexity: 'easy'
    },
    {
      type: 'targeting-mismatch',
      description: 'Ad spend targeting wrong audience or locations',
      threshold: 15,
      severity: 'high',
      indicators: [
        'High CPC on irrelevant keywords',
        'Geographic targeting mismatch',
        'Demographic targeting errors',
        'Time of day optimization issues',
        'Device targeting inefficiencies'
      ],
      fixComplexity: 'medium'
    },
    {
      type: 'technical-configuration',
      description: 'Technical implementation issues causing waste',
      threshold: 5,
      severity: 'medium',
      indicators: [
        'Slow landing page load times',
        'Missing mobile optimization',
        'Broken conversion tracking',
        'Pixel implementation errors',
        'API integration failures'
      ],
      fixComplexity: 'medium'
    }
  ];

  analyzeWaste(adSpend: AdSpendAnalysis): WasteAnalysis {
    const categories: WasteCategory = {
      noTracking: 0,
      wrongAttribution: 0,
      poorTargeting: 0,
      technicalIssues: 0,
      invalidVersions: 0,
      budgetDrift: 0,
      fraud: 0
    };

    const detectedIssues: string[] = [];
    const opportunities: any[] = [];
    let totalWastedSpend = 0;

    // Analyze tracking issues
    const noTrackingPattern = this.wastePatterns.find(p => p.type === 'no-tracking');
    if (noTrackingPattern && this.detectNoTracking(adSpend)) {
      const wastedSpend = adSpend.monthlySpend * 0.3;
      totalWastedSpend += wastedSpend;
      
      categories.noTracking = wastedSpend;
      detectedIssues.push(noTrackingPattern.description);
      
      opportunities.push({
        type: 'quick-win',
        description: 'Implement basic conversion tracking',
        potentialSavings: wastedSpend,
        implementationDifficulty: 'medium',
        timeToImplement: '2-4 weeks',
        impact: 'high'
      });
    }

    // Analyze attribution issues
    const attributionPattern = this.wastePatterns.find(p => p.type === 'attribution-window');
    if (attributionPattern && this.detectAttributionIssues(adSpend)) {
      const wastedSpend = adSpend.monthlySpend * 0.15;
      totalWastedSpend += wastedSpend;
      
      categories.wrongAttribution = wastedSpend;
      detectedIssues.push(attributionPattern.description);
      
      opportunities.push({
        type: 'strategic',
        description: 'Optimize attribution windows by product type',
        potentialSavings: wastedSpend,
        implementationDifficulty: 'hard',
        timeToImplement: '4-8 weeks',
        impact: 'medium'
      });
    }

    // Analyze targeting issues
    const targetingPattern = this.wastePatterns.find(p => p.type === 'targeting-mismatch');
    if (targetingPattern && this.detectTargetingIssues(adSpend)) {
      const wastedSpend = adSpend.monthlySpend * 0.2;
      totalWastedSpend += wastedSpend;
      
      categories.poorTargeting = wastedSpend;
      detectedIssues.push(targetingPattern.description);
      
      opportunities.push({
        type: 'technical',
        description: 'Optimize audience targeting and bid management',
        potentialSavings: wastedSpend,
        implementationDifficulty: 'medium',
        timeToImplement: '3-6 weeks',
        impact: 'high'
      });
    }

    // Analyze technical issues
    const technicalPattern = this.wastePatterns.find(p => p.type === 'technical-configuration');
    if (technicalPattern && this.detectTechnicalIssues()) {
      const wastedSpend = adSpend.monthlySpend * 0.1;
      totalWastedSpend += wastedSpend;
      
      categories.technicalIssues = wastedSpend;
      detectedIssues.push(technicalPattern.description);
      
      opportunities.push({
        type: 'technical',
        description: 'Fix technical implementation and performance issues',
        potentialSavings: wastedSpend,
        implementationDifficulty: 'easy',
        timeToImplement: '1-3 weeks',
        impact: 'high'
      });
    }

    // Analyze budget drift
    const budgetDrift = this.detectBudgetDrift(adSpend);
    if (budgetDrift > 0.05) {
      const wastedSpend = adSpend.monthlySpend * budgetDrift;
      totalWastedSpend += wastedSpend;
      
      categories.budgetDrift = wastedSpend;
      detectedIssues.push('Budget drift detected');
      
      opportunities.push({
        type: 'technical',
        description: 'Implement automated budget monitoring and alerts',
        potentialSavings: wastedSpend * 12,
        implementationDifficulty: 'easy',
        timeToImplement: '1-2 weeks',
        impact: 'medium'
      });
    }

    const wastePercentage = adSpend.monthlySpend > 0 ? (totalWastedSpend / adSpend.monthlySpend) * 100 : 0;
    const confidence = Math.min(0.9, Math.max(0.1, 1 - (detectedIssues.length * 0.1)));

    return {
      totalWastedSpend,
      wastePercentage,
      categories,
      confidence,
      recommendations: this.generateRecommendations(detectedIssues),
      detectedIssues
    };
  }

  private detectNoTracking(adSpend: AdSpendAnalysis): boolean {
    return adSpend.platforms.some(platform => {
      const googleAds = platform.platform === 'google-ads';
      if (googleAds) {
        return !googleAds.hasConversionTracking || 
               (!googleAds.conversionActionTypes || googleAds.conversionActionTypes.length === 0);
      }
      
      const metaAds = platform.platform === 'meta-ads';
      if (metaAds) {
        return !metaAds.hasPixel || 
               (!metaAds.conversionActionTypes || metaAds.conversionActionTypes.length === 0);
      }
      
      return false;
    });
  }

  private detectAttributionIssues(adSpend: AdSpendAnalysis): boolean {
    return adSpend.attribution.conversionWindow.defaultDays > 30 ||
           adSpend.attribution.model === 'last-click' && 
           adSpend.attribution.crossDevice === false;
  }

  private detectTargetingIssues(adSpend: AdSpendAnalysis): boolean {
    return adSpend.platforms.some(platform => {
      return (platform.ctr < 0.01 && platform.cpc > 10) ||
             (platform.ctr > 0.05 && platform.conversionRate < 0.02) ||
             platform.roas < 1.0;
    });
  }

  private detectTechnicalIssues(): boolean {
    return false;
  }

  private detectBudgetDrift(adSpend: AdSpendAnalysis): number {
    const latestMonth = adSpend.platforms[0]?.lastImportDate;
    if (!latestMonth) return 0;

    const threeMonthsAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    if (new Date(latestMonth) < threeMonthsAgo) return 0;

    const recentPlatforms = adSpend.platforms.slice(-3);
    if (recentPlatforms.length < 3) return 0;

    const monthlySpends = recentPlatforms.map(p => p.monthlySpend);
    const avgSpend = monthlySpends.reduce((sum, spend) => sum + spend, 0) / monthlySpends.length;
    const latestSpend = monthlySpends[monthlySpends.length - 1];
    
    return Math.abs((latestSpend - avgSpend) / avgSpend);
  }

  private generateRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];

    if (issues.includes('No conversion tracking')) {
      recommendations.push('Implement conversion tracking pixels on all key pages');
      recommendations.push('Set up thank you page confirmation events');
      recommendations.push('Track cart abandonment and checkout process');
    }

    if (issues.includes('Attribution window issues')) {
      recommendations.push('Optimize conversion windows based on product type');
      recommendations.push('Implement post-view attribution for consideration period');
      recommendations.push('Set custom attribution rules for high-value products');
    }

    if (issues.includes('Targeting mismatch')) {
      recommendations.push('Review and refine audience targeting criteria');
      recommendations.push('Implement negative keyword lists to reduce waste');
      recommendations.push('Optimize geographic and demographic targeting');
      recommendations.push('Use performance data to inform bidding strategy');
    }

    if (issues.includes('Technical configuration')) {
      recommendations.push('Optimize landing page load speed and performance');
      recommendations.push('Implement responsive design for mobile users');
      recommendations.push('Fix broken tracking pixels and API integrations');
      recommendations.push('Ensure all tracking events fire correctly');
    }

    if (issues.includes('Budget drift')) {
      recommendations.push('Set up automated budget monitoring and alerts');
      recommendations.push('Implement daily budget caps and pacing');
      recommendations.push('Use AI-driven budget optimization');
    }

    return recommendations;
  }

  getWastePatterns(): WastePattern[] {
    return this.wastePatterns;
  }

  getWasteCategories(): { [key: string]: string } {
    return {
      noTracking: 'Missing or broken conversion tracking',
      wrongAttribution: 'Incorrect attribution model or window',
      poorTargeting: 'Audience targeting and optimization issues',
      technicalIssues: 'Technical implementation problems',
      invalidVersions: 'Outdated platform or pixel versions',
      budgetDrift: 'Budget not optimized or monitored',
      fraud: 'Invalid or fraudulent activity'
    };
  }
}