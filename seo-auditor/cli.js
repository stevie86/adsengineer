#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ShopifySEOAuditor from './shopify-seo-auditor.js';

const program = new Command();

program
  .name('shopify-seo-auditor')
  .description('Comprehensive SEO auditor for Shopify stores')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'Shopify store URL to audit')
  .option('-d, --domain <domain>', 'Shopify domain for specific checks')
  .option('-o, --output <file>', 'Output report to file')
  .option('--no-performance', 'Skip performance analysis')
  .option('--no-content', 'Skip content analysis')
  .option('--no-technical', 'Skip technical SEO checks')
  .option('--no-shopify', 'Skip Shopify-specific analysis')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '10000')
  .action(async (options) => {
    try {
      const auditor = new ShopifySEOAuditor({
        includePerformance: options.performance !== false,
        includeContent: options.content !== false,
        includeTechnical: options.technical !== false,
        includeShopify: options.shopify !== false,
        timeout: parseInt(options.timeout)
      });

      const report = await auditor.auditStore(options.url, options.domain);

      if (options.output) {
        await saveReport(report, options.output);
        console.log(chalk.green(`✅ Report saved to ${options.output}`));
      } else {
        displayReport(report);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

function displayReport(report) {
  console.log(chalk.blue.bold('\n📊 Shopify SEO Audit Report\n'));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(`📍 URL: ${chalk.white(report.url)}`);
  console.log(`📅 Timestamp: ${chalk.white(new Date(report.timestamp).toLocaleString())}`);

  console.log(chalk.yellow.bold('\n📈 Scores:'));
  Object.entries(report.scores).forEach(([category, score]) => {
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
    console.log(`  ${category.charAt(0).toUpperCase() + category.slice(1)}: ${chalk[color](score + '/100')}`);
  });

  if (report.issues && report.issues.length > 0) {
    console.log(chalk.red.bold('\n🚨 Issues Found:'));
    report.issues.forEach((issue, index) => {
      console.log(chalk.red(`  ${index + 1}. ${issue}`));
    });
  }

  if (report.recommendations && report.recommendations.length > 0) {
    console.log(chalk.cyan.bold('\n💡 Recommendations:'));
    report.recommendations.forEach((rec, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${rec}`));
    });
  }

  if (report.shopify) {
    console.log(chalk.magenta.bold('\n🛒 Shopify Analysis:'));
    const shopifyData = report.shopify.data;
    
    console.log(chalk.magenta(`  Theme: ${shopifyData.themeName || 'Unknown'} (ID: ${shopifyData.themeId || 'Unknown'})`));
    console.log(chalk.magenta(`  Products Found: ${shopifyData.productCount}`));
    console.log(chalk.magenta(`  Accelerated Checkout: ${shopifyData.hasAcceleratedCheckout ? '✅' : '❌'}`));
    console.log(chalk.magenta(`  Product Reviews: ${shopifyData.hasProductReviews ? '✅' : '❌'}`));
    console.log(chalk.magenta(`  Quick View: ${shopifyData.hasQuickView ? '✅' : '❌'}`));
    
    const imageStats = shopifyData.imageOptimization;
    if (imageStats.totalImages > 0) {
      const lazyPercentage = Math.round((imageStats.lazyLoading / imageStats.totalImages) * 100);
      console.log(chalk.magenta(`  Image Lazy Loading: ${lazyPercentage}% (${imageStats.lazyLoading}/${imageStats.totalImages})`));
    }
  }
}

async function saveReport(report, filename) {
  const fs = await import('fs/promises');
  await fs.writeFile(filename, JSON.stringify(report, null, 2));
}

program.parse();