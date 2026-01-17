import { SiteDetection, DetectionResult } from './technology-detector';
import { SiteAnalysis, AdSpendAnalysis, WasteAnalysis } from './ecommerce-analysis';

export interface ConfidenceScore {
  overall: number;
  breakdown: {
    platform: number;
    analytics: number;
    advertising: number;
    tracking: number;
    technical: number;
    data: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    uncertain: string[];
  };
}

export class ConfidenceScorer {
  calculateOverallConfidence(detection: SiteDetection, analysis: SiteAnalysis): ConfidenceScore {
    const platform = this.scorePlatformConfidence(detection.platform, analysis);
    const analytics = this.scoreAnalyticsConfidence(detection.analytics, analysis.analytics);
    const advertising = this.scoreAdvertisingConfidence(detection.advertising, analysis);
    const tracking = this.scoreTrackingConfidence(detection.tracking, analysis.tracking);
    const technical = this.scoreTechnicalConfidence(detection.performance, analysis.performance);
    const data = this.scoreDataConfidence(detection.tracking, analysis);

    const overall = (platform + analytics + advertising + tracking + technical + data) / 6;

    return {
      overall,
      breakdown: {
        platform,
        analytics,
        advertising,
        tracking,
        technical,
        data
      },
      factors: this.getConfidenceFactors(detection, analysis)
    };
  }

  private scorePlatformConfidence(platform: DetectionResult, analysis: SiteAnalysis): number {
    let score = platform.confidence;

    if (platform.technology === 'shopify' && analysis.platform === 'shopify') {
      score += 0.2;
    }

    if (platform.version && this.isRecentVersion(platform.version)) {
      score += 0.1;
    }

    if (platform.evidence.length > 3) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreAnalyticsConfidence(analytics: DetectionResult[], analysis: any): number {
    if (!analytics.length) return 0;

    let score = analytics.reduce((sum, a) => sum + a.confidence, 0) / analytics.length;

    if (analysis.analytics?.enhancedEcommerce) {
      score += 0.2;
    }

    if (analysis.analytics?.hasProductData) {
      score += 0.1;
    }

    if (analysis.analytics?.hasRevenueTracking) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreAdvertisingConfidence(advertising: DetectionResult[], analysis: any): number {
    if (!advertising.length) return 0;

    let score = advertising.reduce((sum, a) => sum + a.confidence, 0) / advertising.length;

    const googleAds = advertising.find(a => a.technology === 'google-ads');
    if (googleAds?.details?.hasConversionTracking) {
      score += 0.2;
    }

    const metaAds = advertising.find(a => a.technology === 'meta-ads');
    if (metaAds?.details?.hasPixel) {
      score += 0.1;
    }

    if (analysis.googleAds?.hasEnhancedEcommerce) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreTrackingConfidence(tracking: DetectionResult[], analysis: any): number {
    if (!tracking.length) return 0;

    let score = tracking.reduce((sum, a) => sum + a.confidence, 0) / tracking.length;

    if (analysis.tracking?.gtagImplementation !== 'none') {
      score += 0.2;
    }

    if (analysis.tracking?.consentManagement !== 'none') {
      score += 0.1;
    }

    if (analysis.tracking?.dataLayer?.hasEcommerceEvents) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreTechnicalConfidence(performance: DetectionResult[], analysis: any): number {
    if (!performance.length) return 0.5;

    let score = performance.reduce((sum, a) => sum + a.confidence, 0) / performance.length;

    if (analysis.performance?.pageSpeed?.desktop > 70) {
      score += 0.1;
    }

    if (analysis.performance?.pageSpeed?.mobile > 60) {
      score += 0.1;
    }

    if (analysis.performance?.mobileOptimization === 'excellent') {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private scoreDataConfidence(tracking: DetectionResult[], analysis: any): number {
    let score = 0.5;

    if (analysis.tracking?.dataLayer?.hasProductData) {
      score += 0.2;
    }

    if (analysis.tracking?.dataLayer?.hasRevenueData) {
      score += 0.2;
    }

    if (analysis.analytics?.hasFunnelAnalysis) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private getConfidenceFactors(detection: SiteDetection, analysis: SiteAnalysis): {
    positive: string[];
    negative: string[];
    uncertain: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];
    const uncertain: string[] = [];

    if (detection.platform.confidence > 0.8) {
      positive.push(`Platform clearly identified: ${detection.platform.technology}`);
    } else if (detection.platform.confidence < 0.3) {
      negative.push('Platform could not be identified');
    } else {
      uncertain.push('Platform identification uncertain');
    }

    if (detection.analytics.length > 0) {
      positive.push(`Analytics detected: ${detection.analytics.map(a => a.technology).join(', ')}`);
    } else {
      negative.push('No analytics platform detected');
    }

    if (detection.advertising.length > 0) {
      positive.push(`Advertising platforms detected: ${detection.advertising.map(a => a.technology).join(', ')}`);
    } else {
      negative.push('No advertising platforms detected');
    }

    if (analysis.tracking?.gtagImplementation !== 'none') {
      positive.push('Tracking implementation detected');
    } else {
      negative.push('No tracking implementation found');
    }

    if (analysis.sslStatus === 'secure') {
      positive.push('HTTPS properly configured');
    } else {
      negative.push('HTTPS not properly configured');
    }

    return { positive, negative, uncertain };
  }

  private isRecentVersion(version: string): boolean {
    const versionParts = version.split('.').map(Number);
    if (versionParts.length < 2) return false;

    const major = versionParts[0];
    const minor = versionParts[1];

    return major > 2 || (major === 2 && minor >= 0);
  }

  calculateWasteDetectionConfidence(waste: WasteAnalysis): number {
    let confidence = 0.5;

    if (waste.totalWastedSpend > 0) {
      confidence += 0.2;
    }

    if (waste.categories.length > 0) {
      const avgCategoryConfidence = waste.categories.reduce((sum, cat) => sum + cat.confidence, 0) / waste.categories.length;
      confidence += avgCategoryConfidence * 0.3;
    }

    if (waste.opportunities.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  calculateAdSpendConfidence(adSpend: AdSpendAnalysis): number {
    let confidence = 0.5;

    if (adSpend.monthlySpend > 0) {
      confidence += 0.2;
    }

    if (adSpend.platforms.length > 0) {
      const avgPlatformConfidence = adSpend.platforms.reduce((sum, platform) => {
        let platformConfidence = 0.5;
        if (platform.conversions > 0) platformConfidence += 0.2;
        if (platform.roas > 1) platformConfidence += 0.2;
        if (platform.ctr > 0.01) platformConfidence += 0.1;
        return sum + platformConfidence;
      }, 0) / adSpend.platforms.length;
      confidence += avgPlatformConfidence * 0.3;
    }

    return Math.min(confidence, 1);
  }
}