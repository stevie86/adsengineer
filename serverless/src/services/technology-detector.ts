import { TECHNOLOGY_PATTERNS } from './ecommerce-analysis';

export interface DetectionResult {
  technology: string;
  confidence: number;
  evidence: string[];
  version?: string;
  details?: Record<string, any>;
}

export interface SiteDetection {
  url: string;
  platform: DetectionResult;
  analytics: DetectionResult[];
  advertising: DetectionResult[];
  tracking: DetectionResult[];
  performance: DetectionResult[];
  security: DetectionResult[];
  overallConfidence: number;
}

export class TechnologyDetector {
  private patterns = TECHNOLOGY_PATTERNS;

  async analyzeSite(url: string): Promise<SiteDetection> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    return {
      url,
      platform: await this.detectPlatform(html, headers),
      analytics: await this.detectAnalytics(html, headers),
      advertising: await this.detectAdvertising(html, headers),
      tracking: await this.detectTracking(html, headers),
      performance: await this.detectPerformance(html, headers),
      security: await this.detectSecurity(html, headers),
      overallConfidence: 0
    };
  }

  private async detectPlatform(html: string, headers: Record<string, string>): Promise<DetectionResult> {
    const detections: DetectionResult[] = [];

    for (const [platform, patterns] of Object.entries(this.patterns)) {
      if (platform === 'shopify' || platform === 'woocommerce' || platform === 'magento' || platform === 'bigcommerce') {
        const confidence = this.calculateConfidence(html, headers, patterns);
        if (confidence > 0.3) {
          detections.push({
            technology: platform,
            confidence,
            evidence: this.getEvidence(html, headers, patterns),
            version: this.extractVersion(html, patterns)
          });
        }
      }
    }

    return detections.length > 0 ? detections[0] : {
      technology: 'unknown',
      confidence: 0,
      evidence: []
    };
  }

  private async detectAnalytics(html: string, headers: Record<string, string>): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    if (this.hasPattern(html, this.patterns.googleAnalytics)) {
      const confidence = this.calculateConfidence(html, headers, this.patterns.googleAnalytics);
      detections.push({
        technology: 'google-analytics',
        confidence,
        evidence: this.getEvidence(html, headers, this.patterns.googleAnalytics),
        details: {
          hasGtag: html.includes('gtag('),
          hasDataLayer: html.includes('dataLayer'),
          hasEcommerce: html.includes('ecommerce') || html.includes('purchase')
        }
      });
    }

    return detections;
  }

  private async detectAdvertising(html: string, headers: Record<string, string>): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    if (this.hasPattern(html, this.patterns.googleAds)) {
      detections.push({
        technology: 'google-ads',
        confidence: this.calculateConfidence(html, headers, this.patterns.googleAds),
        evidence: this.getEvidence(html, headers, this.patterns.googleAds),
        details: {
          hasConversionTracking: html.includes('google_conversion'),
          hasGCLID: html.includes('gclid'),
          hasEnhancedEcommerce: html.includes('enhanced_ecommerce')
        }
      });
    }

    if (this.hasPattern(html, this.patterns.metaAds)) {
      detections.push({
        technology: 'meta-ads',
        confidence: this.calculateConfidence(html, headers, this.patterns.metaAds),
        evidence: this.getEvidence(html, headers, this.patterns.metaAds),
        details: {
          hasPixel: html.includes('fbevents'),
          hasCAPI: html.includes('facebook.com/tr'),
          hasFBCLID: html.includes('fbclid')
        }
      });
    }

    if (this.hasPattern(html, this.patterns.tiktok)) {
      detections.push({
        technology: 'tiktok-ads',
        confidence: this.calculateConfidence(html, headers, this.patterns.tiktok),
        evidence: this.getEvidence(html, headers, this.patterns.tikTok),
        details: {
          hasPixel: html.includes('ttq'),
          hasTTCLID: html.includes('ttclid'),
          hasWebEvents: html.includes('tiktok')
        }
      });
    }

    return detections;
  }

  private async detectTracking(html: string, headers: Record<string, string>): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    if (html.includes('dataLayer')) {
      detections.push({
        technology: 'gtm',
        confidence: 0.8,
        evidence: ['dataLayer found in HTML'],
        details: {
          hasEcommerceEvents: html.includes('ecommerce'),
          hasUserTracking: html.includes('user_id'),
          hasProductData: html.includes('product_id')
        }
      });
    }

    if (html.includes('consent-management')) {
      detections.push({
        technology: 'consent-management',
        confidence: 0.6,
        evidence: ['Consent management detected'],
        details: {
          hasGDPRCompliance: html.includes('gdpr'),
          hasCookieBanner: html.includes('cookie')
        }
      });
    }

    return detections;
  }

  private async detectPerformance(html: string, headers: Record<string, string>): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    if (html.includes('rel="preload"')) {
      detections.push({
        technology: 'resource-preloading',
        confidence: 0.7,
        evidence: ['Resource preloading detected']
      });
    }

    if (html.includes('async') || html.includes('defer')) {
      detections.push({
        technology: 'script-optimization',
        confidence: 0.6,
        evidence: ['Async/defer scripts detected']
      });
    }

    return detections;
  }

  private async detectSecurity(html: string, headers: Record<string, string>): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    if (headers['x-frame-options']) {
      detections.push({
        technology: 'clickjacking-protection',
        confidence: 0.9,
        evidence: ['X-Frame-Options header present']
      });
    }

    if (headers['content-security-policy']) {
      detections.push({
        technology: 'csp',
        confidence: 0.9,
        evidence: ['Content-Security-Policy header present']
      });
    }

    return detections;
  }

  private calculateConfidence(html: string, headers: Record<string, string>, patterns: any): number {
    let confidence = 0;
    let totalChecks = 0;

    if (patterns.scripts) {
      totalChecks += patterns.scripts.length;
      confidence += patterns.scripts.filter((script: string) => html.includes(script)).length / patterns.scripts.length;
    }

    if (patterns.meta) {
      totalChecks += patterns.meta.length;
      confidence += patterns.meta.filter((meta: string) => html.includes(meta) || headers[meta]).length / patterns.meta.length;
    }

    if (patterns.domains) {
      totalChecks += patterns.domains.length;
      confidence += patterns.domains.filter((domain: string) => html.includes(domain)).length / patterns.domains.length;
    }

    if (patterns.cookies) {
      totalChecks += patterns.cookies.length;
      confidence += patterns.cookies.filter((cookie: string) => html.includes(cookie)).length / patterns.cookies.length;
    }

    return totalChecks > 0 ? confidence / totalChecks : 0;
  }

  private getEvidence(html: string, headers: Record<string, string>, patterns: any): string[] {
    const evidence: string[] = [];

    if (patterns.scripts) {
      patterns.scripts.forEach((script: string) => {
        if (html.includes(script)) {
          evidence.push(`Script: ${script}`);
        }
      });
    }

    if (patterns.meta) {
      patterns.meta.forEach((meta: string) => {
        if (html.includes(meta) || headers[meta]) {
          evidence.push(`Meta: ${meta}`);
        }
      });
    }

    if (patterns.domains) {
      patterns.domains.forEach((domain: string) => {
        if (html.includes(domain)) {
          evidence.push(`Domain: ${domain}`);
        }
      });
    }

    return evidence;
  }

  private extractVersion(html: string, patterns: any): string | undefined {
    if (patterns.meta) {
      for (const meta of patterns.meta) {
        if (meta.includes('version')) {
          const match = html.match(new RegExp(`${meta}["']?\\s*[:=]\\s*["']?([^"'>\\s]+)`));
          if (match) {
            return match[1];
          }
        }
      }
    }
    return undefined;
  }

  private hasPattern(html: string, patterns: any): boolean {
    if (patterns.scripts) {
      for (const script of patterns.scripts) {
        if (html.includes(script)) return true;
      }
    }

    if (patterns.objects) {
      for (const obj of patterns.objects) {
        if (html.includes(obj)) return true;
      }
    }

    if (patterns.classes) {
      for (const cls of patterns.classes) {
        if (html.includes(cls)) return true;
      }
    }

    return false;
  }
}