import chalk from 'chalk';
import { parseHTML } from './html-parser.js';

export default class SimpleSEOAuditor {
  constructor() {
    this.rules = {
      titleLength: { min: 30, max: 60 },
      descriptionLength: { min: 120, max: 160 },
      metaViewport: true,
      metaDescription: true,
      canonicalLink: true,
      imgAltAttributes: true,
      headingStructure: true
    };
  }

  async audit(url) {
    console.log(chalk.blue(`🔍 Auditing: ${url}`));
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      const doc = parseHTML(html);
      
      const results = this.analyzeDocument(doc, url);
      const score = this.calculateScore(results);
      
      return {
        url,
        timestamp: new Date(),
        score,
        results,
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      throw new Error(`Audit failed: ${error.message}`);
    }
  }

  analyzeDocument(doc, url) {
    const results = [];

    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const titleLength = title.length;
    
    results.push({
      check: 'Title Length',
      status: titleLength >= this.rules.titleLength.min && titleLength <= this.rules.titleLength.max ? 'pass' : 'fail',
      score: titleLength >= this.rules.titleLength.min && titleLength <= this.rules.titleLength.max ? 100 : 0,
      details: { length: titleLength, title }
    });

    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const descLength = description.length;
    
    results.push({
      check: 'Meta Description',
      status: descLength >= this.rules.descriptionLength.min && descLength <= this.rules.descriptionLength.max ? 'pass' : 'fail',
      score: descLength >= this.rules.descriptionLength.min && descLength <= this.rules.descriptionLength.max ? 100 : 0,
      details: { length: descLength, description }
    });

    const h1s = doc.querySelectorAll('h1');
    results.push({
      check: 'H1 Structure',
      status: h1s.length === 1 ? 'pass' : 'fail',
      score: h1s.length === 1 ? 100 : 50,
      details: { count: h1s.length }
    });

    const images = doc.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')?.trim());
    
    results.push({
      check: 'Image Alt Attributes',
      status: imagesWithoutAlt.length === 0 ? 'pass' : 'fail',
      score: imagesWithoutAlt.length === 0 ? 100 : Math.max(0, 100 - (imagesWithoutAlt.length * 10)),
      details: { 
        total: images.length, 
        withoutAlt: imagesWithoutAlt.length,
        percentage: Math.round((images.length - imagesWithoutAlt.length) / images.length * 100)
      }
    });

    const canonical = doc.querySelector('link[rel="canonical"]');
    results.push({
      check: 'Canonical Link',
      status: canonical ? 'pass' : 'fail',
      score: canonical ? 100 : 50,
      details: { exists: !!canonical, href: canonical?.getAttribute('href') }
    });

    const viewport = doc.querySelector('meta[name="viewport"]');
    results.push({
      check: 'Meta Viewport',
      status: viewport ? 'pass' : 'fail',
      score: viewport ? 100 : 50,
      details: { exists: !!viewport, content: viewport?.getAttribute('content') }
    });

    if (url.includes('shopify') || url.includes('/products/') || url.includes('/collections/')) {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      let hasProductSchema = false;
      
      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            hasProductSchema = true;
          }
        } catch (e) {}
      });

      results.push({
        check: 'Product Schema',
        status: hasProductSchema ? 'pass' : 'warn',
        score: hasProductSchema ? 100 : 80,
        details: { hasSchema: hasProductSchema }
      });
    }

    return results;
  }

  calculateScore(results) {
    const weightedScores = results.map(result => ({
      score: result.score,
      weight: 1
    }));

    const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0);
    const weightedScore = weightedScores.reduce((sum, item) => sum + (item.score * item.weight), 0);

    return Math.round(weightedScore / totalWeight);
  }

  parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  parseHTML(html) {
    const doc = parseHTML(html);
    return doc;
  }

  generateSummary(results) {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warn').length;

    return {
      passed,
      failed,
      warnings,
      total: results.length,
      criticalIssues: failed
    };
  }
}