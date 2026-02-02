/**
 * CLI Entry Point
 *
 * Main CLI for GTM Config Parser
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

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
  .action(async (file, options) => {
    console.log(`Extracting from: ${file}`);

    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exit(1);
    }

    try {
      const gtmExport = JSON.parse(fs.readFileSync(file, 'utf-8'));

      const { extractVariables } = await import('./services/gtm-parser/extractor/variable-extractor.js');
      const { mapVariablesToDataLayer } = await import('./services/gtm-parser/path-mapper/dataLayer-mapper.js');
      const { generateConfig, writeConfigToFile } = await import('./services/gtm-parser/generator/config-generator.js');

      const allVariables = new Set();

      if (Array.isArray(gtmExport.tag)) {
        for (const tag of gtmExport.tag) {
          const vars = extractVariables(tag);
          vars.forEach(v => allVariables.add(v));
        }
      }

      console.log(`Extracted ${allVariables.size} unique variables`);

      const mappings = mapVariablesToDataLayer(Array.from(allVariables));
      console.log(`Mapped ${Array.from(mappings.values()).filter(v => v !== null).length} workers to dataLayer paths`);

      const config = generateConfig(options.customer, mappings);
      writeConfigToFile(config, options.output);

      console.log(`Config written to: ${options.output}`);
      console.log(`Events detected: ${config.events.length}`);
      config.events.forEach((event) => console.log(`  - ${event.eventName}`));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();