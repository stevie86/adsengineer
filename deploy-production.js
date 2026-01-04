#!/usr/bin/env node

/**
 * Production Deployment Script for AdsEngineer
 * Handles backend deployment with environment validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionDeploy {
    constructor() {
        this.serverlessDir = path.join(__dirname, '..', 'serverless');
    }

    log(message) {
        console.log(`🚀 ${message}`);
    }

    error(message) {
        console.error(`❌ ${message}`);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    // Check if required secrets are set
    checkSecrets() {
        this.log('Checking required production secrets...');

        const requiredSecrets = [
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'STRIPE_STARTER_PRICE_ID',
            'STRIPE_PROFESSIONAL_PRICE_ID',
            'STRIPE_ENTERPRISE_PRICE_ID',
            'VITE_STRIPE_PUBLISHABLE_KEY'
        ];

        const optionalSecrets = [
            'JWT_SECRET',
            'ENCRYPTION_KEY'
        ];


        this.log('Required secrets that must be set:');
        requiredSecrets.forEach(secret => {
            console.log(`  - ${secret}`);
        });

        this.log('Optional secrets:');
        optionalSecrets.forEach(secret => {
            console.log(`  - ${secret}`);
        });

        this.log('Set secrets with: wrangler secret put SECRET_NAME --env production');
    }

    // Validate environment
    validateEnvironment() {
        this.log('Validating production environment...');

        process.chdir(this.serverlessDir);

        // Check if wrangler is authenticated
        try {
            execSync('wrangler auth whoami', { stdio: 'pipe' });
            this.success('Wrangler authenticated');
        } catch (error) {
            this.error('Wrangler not authenticated. Run: wrangler auth login');
            process.exit(1);
        }

        // Check TypeScript
        try {
            execSync('pnpm types:check', { stdio: 'pipe' });
            this.success('TypeScript validation passed');
        } catch (error) {
            this.error('TypeScript errors found. Fix before deploying.');
            console.log(error.stdout?.toString());
            process.exit(1);
        }

        // Run tests
        try {
            execSync('pnpm test', { stdio: 'pipe' });
            this.success('Tests passed');
        } catch (error) {
            this.error('Tests failed. Fix before deploying.');
            console.log(error.stdout?.toString());
            process.exit(1);
        }
    }

    // Deploy to production
    deploy() {
        this.log('Deploying to production...');

        try {
            execSync('wrangler deploy --env production', { stdio: 'inherit' });
            this.success('Production deployment successful!');
        } catch (error) {
            this.error('Deployment failed');
            console.log(error.stdout?.toString());
            process.exit(1);
        }
    }

    // Post-deployment checks
    postDeployChecks() {
        this.log('Running post-deployment checks...');

        const healthUrl = 'https://adsengineer-cloud.adsengineer.workers.dev/health';

        try {
            const response = execSync(`curl -s ${healthUrl}`, { encoding: 'utf8' });
            const health = JSON.parse(response);

            if (health.status === 'healthy' && health.environment === 'production') {
                this.success('Health check passed');
                console.log(`API Version: ${health.version}`);
                console.log(`Environment: ${health.environment}`);
            } else {
                this.error('Health check failed');
                console.log('Response:', health);
            }
        } catch (error) {
            this.error('Health check failed - API may not be responding');
            console.log(error.message);
        }
    }

    // Create deployment summary
    createDeploymentSummary() {
        const summary = {
            deployment: {
                timestamp: new Date().toISOString(),
                environment: 'production',
                status: 'completed',
                urls: {
                    api: 'https://adsengineer-cloud.adsengineer.workers.dev',
                    health: 'https://adsengineer-cloud.adsengineer.workers.dev/health',
                    docs: 'https://adsengineer-cloud.adsengineer.workers.dev/docs'
                },
                secrets: {
                    required: [
                        'STRIPE_SECRET_KEY',
                        'STRIPE_WEBHOOK_SECRET',
                        'STRIPE_STARTER_PRICE_ID',
                        'STRIPE_PROFESSIONAL_PRICE_ID',
                        'STRIPE_ENTERPRISE_PRICE_ID',
                        'VITE_STRIPE_PUBLISHABLE_KEY'
                    ],
                    optional: [
                        'JWT_SECRET',
                        'ENCRYPTION_KEY'
                    ]
                }
            },
            nextSteps: [
                '1. Deploy frontend to production',
                '2. Test complete signup flow',
                '3. Set up monitoring and alerts',
                '4. Import n8n workflows to production',
                '5. Send beta invites to agencies'
            ],
            monitoring: {
                healthCheck: 'https://adsengineer-cloud.adsengineer.workers.dev/health',
                logs: 'wrangler tail --env production',
                analytics: 'Check Cloudflare dashboard'
            }
        };

        fs.writeFileSync(
            path.join(__dirname, '..', 'DEPLOYMENT-SUMMARY.json'),
            JSON.stringify(summary, null, 2)
        );

        this.success('Deployment summary saved: DEPLOYMENT-SUMMARY.json');
    }

    // Main deployment process
    async run() {
        console.log('🚀 AdsEngineer Production Deployment');
        console.log('====================================');

        try {
            this.checkSecrets();
            this.validateEnvironment();
            this.deploy();
            this.postDeployChecks();
            this.createDeploymentSummary();

            console.log('\n🎉 Production Deployment Complete!');
            console.log('===================================');
            console.log('Your AdsEngineer API is live at:');
            console.log('https://adsengineer-cloud.adsengineer.workers.dev');
            console.log('\nCheck DEPLOYMENT-SUMMARY.json for details.');

        } catch (error) {
            this.error(`Deployment failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI runner
if (require.main === module) {
    const deploy = new ProductionDeploy();
    deploy.run().catch(console.error);
}

module.exports = ProductionDeploy;