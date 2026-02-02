/**
 * CLI Entry Point
 *
 * Main CLI for GTM Config Parser
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('gtm-parser')
  .description('GTM Config Parser - Extract dataLayer variable mappings from GTM exports')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract variable mappings from GTM export JSON')
  .argument('<file>', 'GTM export JSON file path')
  .option('-o, --output <path>', 'Output config.json path', './config.json')
  .option('-c, --customer <id>', 'Customer ID', 'customer-001')
  .action(async (file: string, options: Record<string, string>) => {
    console.log(`Extracting from: ${file}`);

    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exit(1);
    }

try {
      const gtmExport = JSON.parse(fs.readFileSync(file, 'utf-8'));

      const { extractVariables, extractMacroDefinitions } = await import('./services/gtm-parser/extractor/variable-extractor.ts');
      const { generateConfig, writeConfigToFile } = await import('./services/gtm-parser/generator/config-generator.ts');

      // Handle both direct structure and containerVersion wrapper
      const exportData = gtmExport.containerVersion || gtmExport;

      const allVariables = new Set();

      if (Array.isArray(exportData.tag)) {
        for (const tag of exportData.tag) {
          const vars = extractVariables(tag);
          vars.forEach(v => allVariables.add(v));
        }
      }

      // Both 'macro' (GTM v1) and 'variable' (GTM v2/SSGT) arrays
      const macroDefinitions = extractMacroDefinitions(exportData.macro || exportData.variable || []);
      console.log(`Extracted ${allVariables.size} unique variables from tags`);
      console.log(`Extracted ${macroDefinitions.size} macro definitions with dataLayer paths`);

      const config = generateConfig(options.customer, macroDefinitions);
      writeConfigToFile(config, options.output);

      console.log(`Config written to: ${options.output}`);
      console.log(`Events detected: ${config.events.length}`);
      config.events.forEach((event) => console.log(`  - ${event.eventName}`));
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();