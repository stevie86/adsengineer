#!/usr/bin/env node

import SimpleSEOAuditor from './simple-auditor.js';
import chalk from 'chalk';

async function runTest() {
  console.log('🧪 Testing Simple SEO Auditor...\n');

  const auditor = new SimpleSEOAuditor();
  
  const testUrls = [
    'https://mycannaby.de',
    'https://google.com',
    'https://example.com'
  ];

  for (const url of testUrls) {
    try {
      console.log(`🔍 Auditing: ${url}`);
      
      const report = await auditor.audit(url);
      
      console.log(chalk.blue.bold('\n📊 Audit Report:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`📍 URL: ${chalk.white(report.url)}`);
      console.log(`📈 Overall Score: ${report.score}/100`);
      
      if (report.summary.failed > 0) {
        console.log(chalk.red.bold('\n🚨 Issues Found:'));
        report.results.forEach(result => {
          if (result.status === 'fail') {
            console.log(chalk.red(`  ❌ ${result.check}`));
            console.log(chalk.red(`     ${JSON.stringify(result.details)}`));
          }
        });
      }

      if (report.summary.warnings > 0) {
        console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
        report.results.forEach(result => {
          if (result.status === 'warn') {
            console.log(chalk.yellow(`  ⚠️  ${result.check}`));
            console.log(chalk.yellow(`     ${JSON.stringify(result.details)}`));
          }
        });
      }

      console.log(chalk.green.bold('\n✅ Passed Checks:'));
      report.results.forEach(result => {
        if (result.status === 'pass') {
          console.log(chalk.green(`  ✅ ${result.check}`));
        }
      });

      console.log(chalk.blue('\n📋 Summary:'));
      console.log(`  Passed: ${chalk.green(report.summary.passed)}`);
      console.log(`  Failed: ${chalk.red(report.summary.failed)}`);
      console.log(`  Warnings: ${chalk.yellow(report.summary.warnings)}`);
      console.log(`  Total: ${report.summary.total}`);

      console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');
      
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }
  }
}

runTest();