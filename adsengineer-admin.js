#!/usr/bin/env node

/**
 * AdsEngineer Admin CLI
 * Command-line interface for AdsEngineer API management
 * Modular plugin architecture for extensibility
 */

const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');

class AdsEngineerAdmin {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.ADSENGINEER_BASE_URL || 'https://advocate-cloud.adsengineer.workers.dev';
        this.apiKey = config.apiKey || process.env.ADSENGINEER_API_KEY;

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined,
                'Content-Type': 'application/json'
            }
        });

        this.plugins = new Map();
        this.loadPlugins();
    }

    // Plugin system
    loadPlugins() {
        const pluginsDir = path.join(__dirname, 'plugins');

        try {
            const pluginFiles = fs.readdirSync(pluginsDir).filter(file =>
                file.endsWith('.js') && file !== 'index.js'
            );

            for (const file of pluginFiles) {
                try {
                    const pluginPath = path.join(pluginsDir, file);
                    const plugin = require(pluginPath);

                    if (plugin.name && plugin.commands) {
                        this.plugins.set(plugin.name, plugin);
                        console.log(`🔌 Loaded plugin: ${plugin.name}`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Failed to load plugin ${file}:`, error.message);
                }
            }
        } catch (error) {
            // Plugins directory doesn't exist or can't be read - that's fine
        }
    }

    getAllCommands() {
        const coreCommands = {
            'interactive': { description: 'Start interactive mode' },
            'auth': { description: 'Test authentication' },
            'leads': { description: 'List all leads' },
            'analytics': { description: 'Show lead analytics' },
            'agencies': { description: 'List all agencies' },
            'health': { description: 'System health check' },
            'export': { description: 'Export leads to JSON file' },
            'import': { description: 'Import leads from JSON file' }
        };

        // Add plugin commands
        for (const [pluginName, plugin] of this.plugins) {
            for (const [cmdName, cmdConfig] of Object.entries(plugin.commands)) {
                coreCommands[`${pluginName}:${cmdName}`] = {
                    description: cmdConfig.description,
                    plugin: pluginName
                };
            }
        }

        return coreCommands;
    }

    // Authentication
    async authenticate() {
        if (!this.apiKey) {
            const answers = await inquirer.prompt([
                {
                    type: 'password',
                    name: 'apiKey',
                    message: 'Enter your AdsEngineer API key:',
                    validate: (input) => input.length > 0 ? true : 'API key is required'
                }
            ]);
            this.apiKey = answers.apiKey;
            this.client.defaults.headers.Authorization = `Bearer ${this.apiKey}`;
        }
        return this.testConnection();
    }

    async testConnection() {
        try {
            await this.client.get('/health');
            console.log('✅ Connected to AdsEngineer API');
            return true;
        } catch (error) {
            console.error('❌ Connection failed:', error.response?.data?.error || error.message);
            return false;
        }
    }

    // Core methods (leads, analytics, etc.) remain the same...

    // Plugin command execution
    async executePluginCommand(pluginName, commandName, args) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin '${pluginName}' not found`);
        }

        const command = plugin.commands[commandName];
        if (!command) {
            throw new Error(`Command '${commandName}' not found in plugin '${pluginName}'`);
        }

        return await command.handler(args, this);
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const admin = new AdsEngineerAdmin();

    // Handle plugin commands
    if (command && command.includes(':')) {
        const [pluginName, cmdName] = command.split(':');
        const cmdArgs = args.slice(1);

        try {
            await admin.executePluginCommand(pluginName, cmdName, cmdArgs);
        } catch (error) {
            console.error('❌ Plugin command failed:', error.message);
            process.exit(1);
        }
        return;
    }

    // Handle core commands
    try {
        switch (command) {
            case 'interactive':
            case 'i':
                await admin.interactiveMode();
                break;

            // ... existing cases ...

            default:
                const allCommands = admin.getAllCommands();
                console.log(`
🔧 AdsEngineer Admin CLI

Usage:
  node adsengineer-admin.js <command> [options]

Core Commands:`);

                for (const [cmd, config] of Object.entries(allCommands)) {
                    if (!config.plugin) {
                        console.log(`  ${cmd.padEnd(15)} ${config.description}`);
                    }
                }

                console.log(`
Plugin Commands:`);
                for (const [cmd, config] of Object.entries(allCommands)) {
                    if (config.plugin) {
                        console.log(`  ${cmd.padEnd(15)} ${config.description} (${config.plugin})`);
                    }
                }

                console.log(`
Environment Variables:
  ADSENGINEER_BASE_URL    API base URL
  ADSENGINEER_API_KEY     Your API key

Examples:
  node adsengineer-admin.js interactive
  node adsengineer-admin.js leads
  node adsengineer-admin.js example:hello world
                `);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = AdsEngineerAdmin;

// Run CLI if called directly
if (require.main === module) {
    main();
}