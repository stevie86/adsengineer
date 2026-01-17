import { z } from 'zod';

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

export class TechStackAnalyzer {
  private patterns = {
    shopify: {
      domains: ['.myshopify.com', '.shopifycdn.com'],
      scripts: ['ShopifyAnalytics', 'Shopify.theme', 'ShopifyBuyButton'],
      meta: ['shopify-checkout-api-token', 'shopify-digital-wallet'],
      cookies: ['_shopify_y', '_shopify_s'],
      apis: ['/admin/api/', '/cart.js', '/products.json'],
      indicators: [
        'Shopify Analytics object present',
        'Buy Button implemented',
        'HTTPS enabled on checkout'
      ]
    },
    woocommerce: {
      scripts: ['woocommerce', 'wc-add-to-cart', 'wc-checkout'],
      meta: ['woocommerce_version', 'wc-api-version'],
      apis: ['/wc-api/v3/', '?rest_route=/wc/'],
      classes: ['woocommerce', 'WooCommerce', 'WC-'],
      indicators: [
        'WC REST API available',
        'Product data accessible',
        'Checkout flow implemented'
      ]
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
      classes: ['bc-', 'BigCommerce']
    },
    googleAnalytics: {
      scripts: ['gtag', 'ga', 'analytics'],
      objects: ['gtag', 'ga', 'dataLayer'],
      events: ['page_view', 'purchase', 'add_to_cart'],
      indicators: [
        'Google Analytics tracking implemented',
        'Enhanced ecommerce tracking active',
        'DataLayer present'
      ]
    },
    googleAds: {
      scripts: ['googleads', 'google_conversion'],
      params: ['gclid', 'dclid', 'gad_source'],
      conversionFormat: ['google_business_online', 'google_retail_online'],
      indicators: [
        'Google Ads conversion tracking',
        'Conversion action types defined',
        'GCLID parameter handling'
      ]
    },
    metaAds: {
      scripts: ['fbevents', 'facebook', 'pixel'],
      params: ['fbclid', 'fbp', '_fbc'],
      conversionFormat: ['fb_pixel', 'fb_server_to_server'],
      indicators: [
        'Meta Pixel implemented',
        'CAPI available',
        'Facebook pixel tracking'
      ]
    },
    tiktok: {
      scripts: ['tiktok', 'ttq'],
      params: ['ttclid', 'tiktok_click_id'],
      pixelEvents: ['PageView', 'ViewContent', 'Purchase'],
      indicators: [
        'TikTok Pixel implemented',
        'TikTok events configured'
      ]
    },
    linkedinAds: {
      scripts: ['linkedininsight', 'linkedin'],
      params: ['msclkid'],
      conversionFormat: ['msclkid'],
      indicators: [
        'LinkedIn Insight Tag present',
        'Conversion tracking active'
      ]
    }
  };

  async analyzeTechStack(url: string): Promise<TechStackAnalysis> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0; Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze ${url}: ${response.status}`);
      }

      const html = await response.text();
      const headers = Object.fromEntries(response.headers.entries());

      const analysis: TechStackAnalysis = {
        platform: await this.detectPlatform(html, headers),
        analytics: await this.detectAnalytics(html, headers),
        advertising: await this.detectAdvertising(html, headers),
        crm: await this.detectCRM(html, headers),
        ecommerce: await this.detectEcommerce(html, headers),
        integration: await this.detectIntegration(html, headers),
        security: await this.detectSecurity(html, headers),
        performance: await this.detectPerformance(html, headers),
        overallConfidence: 0
      };

      const allDetections = [
        analysis.platform,
        ...analysis.analytics,
        ...analysis.advertising,
        analysis.crm,
        analysis.ecommerce,
        ...analysis.integration,
        ...analysis.security,
        ...analysis.performance
      ];

      const confidenceScores = allDetections.map(detection => detection.confidence);
      const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

      analysis.overallConfidence = Math.max(0.1, Math.min(avgConfidence, 1.0));

      return analysis;
    } catch (error) {
      console.error('Tech stack analysis failed:', error);
      throw error;
    }
  }

  private async detectPlatform(html: string, headers: Record<string, string>): Promise<TechDetection> {
    const detections: TechDetection[] = [];

    for (const [platform, patterns] of Object.entries(this.patterns)) {
      if (platform === 'shopify' || platform === 'woocommerce' || platform === 'magento' || platform === 'bigcommerce') {
        const confidence = this.calculateConfidence(html, headers, patterns);
        if (confidence > 0.3) {
          const evidence = this.getEvidence(html, headers, patterns);
          const version = this.extractVersion(html, patterns);

          detections.push({
            technology: platform,
            confidence,
            evidence,
            version
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

  private async detectAnalytics(html: string, headers: Record<string, string>): Promise<TechDetection[]> {
    const detections: TechDetection[] = [];

    if (this.hasPattern(html, this.patterns.googleAnalytics)) {
      const confidence = this.calculateConfidence(html, headers, this.patterns.googleAnalytics);
      const evidence = this.getEvidence(html, headers, this.patterns.googleAnalytics);
      
      const details = {
        hasGtag: html.includes('gtag('),
        hasDataLayer: html.includes('dataLayer'),
        hasEcommerce: html.includes('ecommerce') || html.includes('purchase'),
        hasUserTracking: html.includes('user_id'),
        hasProductData: html.includes('product_id')
      };

      detections.push({
        technology: 'google-analytics',
        confidence,
        evidence,
        details
      });
    }

    return detections;
  }

  private async detectAdvertising(html: string, headers: Record<string, string>): Promise<TechDetection[]> {
    const detections: TechDetection[] = [];

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
        evidence: this.getEvidence(html, headers, this.patterns.tiktok),
        details: {
          hasPixel: html.includes('ttq'),
          hasTTCLID: html.includes('ttclid'),
          hasWebEvents: html.includes('tiktok')
        }
      });
    }

    return detections;
  }

  private async detectCRM(html: string, headers: Record<string, string>): Promise<TechDetection> {
    const crmList = ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'freshworks', 'insightly'];
    
    for (const crm of crmList) {
      if (this.hasPattern(html, { scripts: [crm] })) {
        return {
          technology: crm,
          confidence: 0.7,
          evidence: [`${crm} detected in HTML`]
        };
      }
    }

    return {
      technology: 'none',
      confidence: 0,
      evidence: []
    };
  }

  private async detectEcommerce(html: string, headers: Record<string, string>): Promise<TechDetection> {
    const detections: TechDetection[] = [];

    for (const platform of ['shopify', 'woocommerce', 'magento', 'bigcommerce']) {
      if (this.hasPattern(html, this.patterns[platform as keyof typeof this.patterns])) {
        detections.push({
          technology: platform,
          confidence: this.calculateConfidence(html, headers, this.patterns[platform as keyof typeof this.patterns]),
          evidence: this.getEvidence(html, headers, this.patterns[platform as keyof typeof this.patterns]),
          version: this.extractVersion(html, this.patterns[platform as keyof typeof this.patterns])
        });
      }
    }

    return detections.length > 0 ? detections[0] : {
      technology: 'none',
      confidence: 0,
      evidence: []
    };
  }

  private async detectIntegration(html: string, headers: Record<string, string>): Promise<TechDetection[]> {
    const detections: TechDetection[] = [];

    const paymentProcessors = ['stripe', 'paypal', 'adyen', 'square'];
    for (const processor of paymentProcessors) {
      if (html.includes(processor)) {
        detections.push({
          technology: `payment-${processor}`,
          confidence: 0.8,
          evidence: [`${processor} payment processor detected`]
        });
      }
    }

    const shippingServices = ['shipstation', 'easyship', 'shippo'];
    for (const service of shippingServices) {
      if (html.includes(service)) {
        detections.push({
          technology: `shipping-${service}`,
          confidence: 0.7,
          evidence: [`${service} shipping service detected`]
        });
      }
    }

    return detections;
  }

  private async detectSecurity(html: string, headers: Record<string, string>): Promise<TechDetection[]> {
    const detections: TechDetection[] = [];

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

    if (html.includes('https://') && !html.includes('http://')) {
      detections.push({
        technology: 'https-only',
        confidence: 0.8,
        evidence: ['HTTPS protocol detected']
      });
    }

    return detections;
  }

  private async detectPerformance(html: string, headers: Record<string, string>): Promise<TechDetection[]> {
    const detections: TechDetection[] = [];

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

    return totalChecks > 0 ? Math.min(confidence / totalChecks, 1) : 0;
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

  getPatterns() {
    return this.patterns;
  }
}