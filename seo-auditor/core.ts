import { 
  PageData, 
  SEOAuditReport, 
  SEOAuditConfig, 
  SEOCheckResult, 
  AuditModule 
} from './types.js';

export class SEOAuditor {
  private config: SEOAuditConfig;
  private modules: Map<string, AuditModule> = new Map();

  constructor(config: SEOAuditConfig) {
    this.config = config;
  }

  registerModule(module: AuditModule): void {
    this.modules.set(module.name, module);
  }

  async loadModules(moduleNames: string[]): Promise<void> {
    for (const moduleName of moduleNames) {
      try {
        const module = await import(`./modules/${moduleName}.js`);
        this.registerModule(module.default);
      } catch (error) {
        console.warn(`Failed to load module: ${moduleName}`, error);
      }
    }
  }

  async audit(url: string, options: {
    fetchOptions?: RequestInit;
    timeout?: number;
  } = {}): Promise<SEOAuditReport> {
    const startTime = Date.now();
    
    try {
      const pageData = await this.fetchPageData(url, options);
      const results = await this.runModules(pageData);
      const report = this.generateReport(pageData.url, results);
      
      return {
        ...report,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Audit failed for ${url}: ${error.message}`);
    }
  }

  private async fetchPageData(url: string, options: {
    fetchOptions?: RequestInit;
    timeout?: number;
  }): Promise<PageData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    try {
      const response = await fetch(url, {
        ...options.fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return this.parsePageData(url, html);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parsePageData(url: string, html: string): PageData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return {
      url,
      html,
      title: doc.querySelector('title')?.textContent || '',
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      h1: Array.from(doc.querySelectorAll('h1')).map(h => h.textContent?.trim() || ''),
      h2: Array.from(doc.querySelectorAll('h2')).map(h => h.textContent?.trim() || ''),
      h3: Array.from(doc.querySelectorAll('h3')).map(h => h.textContent?.trim() || ''),
      images: this.parseImages(doc),
      links: this.parseLinks(doc),
      meta: this.parseMeta(doc),
      performance: {},
      schema: this.parseSchema(doc),
      content: this.parseContent(doc)
    };
  }

  private parseImages(doc: Document): PageData['images'] {
    return Array.from(doc.querySelectorAll('img')).map(img => ({
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
      width: img.getAttribute('width') ? parseInt(img.getAttribute('width')!) : undefined,
      height: img.getAttribute('height') ? parseInt(img.getAttribute('height')!) : undefined,
      lazy: img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy',
      optimized: img.getAttribute('src')?.includes('_') || false
    }));
  }

  private parseLinks(doc: Document): PageData['links'] {
    const links = Array.from(doc.querySelectorAll('a[href]'));
    const currentDomain = new URL(doc.location?.href || '').hostname;

    return links.map(link => {
      const href = link.getAttribute('href') || '';
      try {
        const linkUrl = new URL(href, doc.location?.href);
        return {
          href,
          text: link.textContent?.trim() || '',
          rel: link.getAttribute('rel') || '',
          internal: linkUrl.hostname === currentDomain,
          broken: false
        };
      } catch {
        return {
          href,
          text: link.textContent?.trim() || '',
          internal: false,
          broken: true
        };
      }
    });
  }

  private parseMeta(doc: Document): PageData['meta'] {
    const meta: PageData['meta'] = {
      og: {},
      twitter: {},
      customMeta: {}
    };

    doc.querySelectorAll('meta').forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');

      if (!name || !content) return;

      if (name.startsWith('og:')) {
        meta.og[name] = content;
      } else if (name.startsWith('twitter:')) {
        meta.twitter[name] = content;
      } else if (name === 'canonical') {
        meta.canonical = content;
      } else if (name === 'viewport') {
        meta.viewport = content;
      } else if (name === 'robots') {
        meta.robots = content;
      } else {
        meta.customMeta[name] = content;
      }
    });

    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) {
      meta.canonical = canonical.getAttribute('href') || '';
    }

    return meta;
  }

  private parseSchema(doc: Document): PageData['schema'] {
    const schemas: PageData['schema'] = [];
    
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '{}');
        schemas.push({
          type: data['@type'] || 'Unknown',
          data,
          valid: true,
          errors: []
        });
      } catch (error) {
        schemas.push({
          type: 'Invalid',
          data: {},
          valid: false,
          errors: [error.message]
        });
      }
    });

    return schemas;
  }

  private parseContent(doc: Document): PageData['content'] {
    const textContent = doc.body?.textContent || '';
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    
    const keywordDensity: Record<string, number> = {};
    const totalWords = words.length;

    words.forEach(word => {
      const normalizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedWord.length > 2) {
        keywordDensity[normalizedWord] = (keywordDensity[normalizedWord] || 0) + 1;
      }
    });

    Object.keys(keywordDensity).forEach(word => {
      keywordDensity[word] = (keywordDensity[word] / totalWords) * 100;
    });

    return {
      wordCount: totalWords,
      readabilityScore: this.calculateReadability(textContent),
      keywordDensity,
      hasStructuredContent: doc.querySelectorAll('article, section, header, nav, main, aside, footer').length > 0
    };
  }

  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.trim().split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
  }

  private async runModules(pageData: PageData): Promise<SEOCheckResult[]> {
    const allResults: SEOCheckResult[] = [];
    const moduleResults: Record<string, any> = {};

    for (const moduleName of this.config.modules) {
      const module = this.modules.get(moduleName);
      if (!module) {
        console.warn(`Module not found: ${moduleName}`);
        continue;
      }

      try {
        let processedPageData = pageData;
        if (module.preprocess) {
          processedPageData = await module.preprocess(pageData);
        }

        const results = await module.check(processedPageData);
        allResults.push(...results);
      } catch (error) {
        console.error(`Error in module ${moduleName}:`, error);
      }
    }

    return allResults;
  }

  private generateReport(url: string, results: SEOCheckResult[]): SEOAuditReport {
    const categoryScores: Record<string, number> = {};
    const summary = {
      criticalIssues: 0,
      warnings: 0,
      passedChecks: 0,
      totalChecks: results.length
    };

    results.forEach(result => {
      if (result.status === 'fail') summary.criticalIssues++;
      else if (result.status === 'warn') summary.warnings++;
      else summary.passedChecks++;

      const categoryName = result.category.name;
      if (!categoryScores[categoryName]) {
        categoryScores[categoryName] = [];
      }
      categoryScores[categoryName].push(result.score * result.weight);
    });

    Object.keys(categoryScores).forEach(category => {
      const scores = categoryScores[category];
      categoryScores[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length;

    const recommendations = results
      .filter(result => result.status === 'fail' || result.status === 'warn')
      .map(result => result.recommendation)
      .slice(0, 10);

    return {
      url,
      timestamp: new Date(),
      overallScore,
      categoryScores,
      results,
      summary,
      recommendations,
      moduleResults: {}
    };
  }
}