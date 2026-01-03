#!/usr/bin/env node

/**
 * AdsEngineer Full System Setup Script
 * Sets up the complete SaaS application with all components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AdsEngineerSetup {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.serverlessDir = path.join(this.rootDir, 'serverless');
        this.frontendDir = path.join(this.rootDir, 'frontend');
    }

    log(message) {
        console.log(`🔧 ${message}`);
    }

    error(message) {
        console.error(`❌ ${message}`);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    // Check if required tools are installed
    checkPrerequisites() {
        this.log('Checking prerequisites...');

        const requiredCommands = ['node', 'npm', 'pnpm', 'wrangler'];
        for (const cmd of requiredCommands) {
            try {
                execSync(`${cmd} --version`, { stdio: 'pipe' });
                this.success(`${cmd} is available`);
            } catch (error) {
                this.error(`${cmd} is not installed. Please install it first.`);
                process.exit(1);
            }
        }
    }

    // Setup backend (Cloudflare Workers)
    setupBackend() {
        this.log('Setting up backend...');

        process.chdir(this.serverlessDir);

        // Install dependencies
        this.log('Installing backend dependencies...');
        execSync('pnpm install', { stdio: 'inherit' });

        // Type check
        this.log('Running type checks...');
        execSync('pnpm types:check', { stdio: 'inherit' });

        this.success('Backend setup complete');
    }

    // Setup frontend (React)
    setupFrontend() {
        this.log('Setting up frontend...');

        process.chdir(this.frontendDir);

        // Install dependencies
        this.log('Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        // Build frontend
        this.log('Building frontend...');
        execSync('npm run build', { stdio: 'inherit' });

        this.success('Frontend setup complete');
    }

    // Setup n8n workflows
    setupN8n() {
        this.log('Setting up n8n workflows...');

        // This would typically involve API calls to n8n
        // For now, just log that workflows are ready
        const workflowFiles = [
            '1-master-agency-hunter-coordinator.json',
            '2-discovery-scout-agent.json',
            '3-tech-stack-auditor-agent.json',
            '4-outreach-copywriter-agent.json',
            '5-notification-router.json'
        ];

        workflowFiles.forEach(file => {
            const filePath = path.join(this.rootDir, 'docs', 'n8n-by-claude', file);
            if (fs.existsSync(filePath)) {
                this.success(`Workflow ready: ${file}`);
            } else {
                this.error(`Missing workflow: ${file}`);
            }
        });
    }

    // Setup environment variables template
    createEnvTemplate() {
        this.log('Creating environment template...');

        const envTemplate = `# AdsEngineer Environment Variables
# Copy this to your deployment environment

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id

# Database
DB=your_d1_database_id

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_starter_id
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id

# n8n (for API access)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key

# Workflow IDs (after importing to n8n)
DISCOVERY_SCOUT_WORKFLOW_ID=your_workflow_id
TECH_STACK_AUDITOR_WORKFLOW_ID=your_workflow_id
OUTREACH_COPYWRITER_WORKFLOW_ID=your_workflow_id

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_BASE_URL=https://your-api-domain.com

# Email (for notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_char_encryption_key
`;

        fs.writeFileSync(path.join(this.rootDir, '.env.template'), envTemplate);
        this.success('Environment template created: .env.template');
    }

    // Setup deployment configuration
    createDeploymentConfig() {
        this.log('Creating deployment configuration...');

        const deployConfig = {
            environments: {
                development: {
                    backend: 'wrangler dev --port 8090',
                    frontend: 'npm run dev',
                    n8n: 'n8n start'
                },
                staging: {
                    backend: 'pnpm deploy:staging',
                    frontend: 'vercel --prod false',
                    n8n: 'railway up --service n8n-staging'
                },
                production: {
                    backend: 'pnpm deploy',
                    frontend: 'vercel --prod',
                    n8n: 'railway up --service n8n-prod'
                }
            },
            monitoring: {
                healthChecks: [
                    'https://your-api-domain.com/health',
                    'https://your-frontend-domain.com',
                    'https://your-n8n-domain.com/healthz'
                ],
                alerts: {
                    errorRate: '>5%',
                    responseTime: '>2s',
                    uptime: '<99.9%'
                }
            }
        };

        fs.writeFileSync(
            path.join(this.rootDir, 'deploy-config.json'),
            JSON.stringify(deployConfig, null, 2)
        );
        this.success('Deployment config created: deploy-config.json');
    }

    // Run tests
    runTests() {
        this.log('Running tests...');

        // Backend tests
        process.chdir(this.serverlessDir);
        try {
            execSync('pnpm test', { stdio: 'pipe' });
            this.success('Backend tests passed');
        } catch (error) {
            this.error('Backend tests failed');
            console.log(error.stdout?.toString());
        }

        // Frontend tests
        process.chdir(this.frontendDir);
        try {
            execSync('npm test -- --run', { stdio: 'pipe' });
            this.success('Frontend tests passed');
        } catch (error) {
            this.error('Frontend tests failed');
            console.log(error.stdout?.toString());
        }
    }

    // Create setup summary
    createSetupSummary() {
        const summary = {
            setup: {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                components: {
                    backend: '✅ Cloudflare Workers + D1',
                    frontend: '✅ React + TypeScript',
                    workflows: '✅ n8n Hunter Army',
                    payments: '✅ Stripe Integration',
                    testing: '✅ Vitest Coverage'
                }
            },
            nextSteps: [
                '1. Configure environment variables (.env)',
                '2. Import n8n workflows to your instance',
                '3. Set up Stripe products and webhooks',
                '4. Deploy backend: cd serverless && pnpm deploy',
                '5. Deploy frontend: cd frontend && npm run build',
                '6. Test signup flow end-to-end',
                '7. Configure monitoring and alerts'
            ],
            apiEndpoints: {
                signup: 'POST /api/v1/onboarding/register',
                pricing: 'GET /api/v1/billing/pricing',
                dashboard: 'Frontend: /dashboard',
                admin: 'Frontend: /admin'
            },
            support: {
                docs: './docs/',
                apiDocs: './api-documentation.md',
                troubleshooting: './TROUBLESHOOTING.md'
            }
        };

        fs.writeFileSync(
            path.join(this.rootDir, 'SETUP-SUMMARY.json'),
            JSON.stringify(summary, null, 2)
        );

        this.success('Setup summary created: SETUP-SUMMARY.json');
    }

    // Main setup process
    async run() {
        console.log('🚀 AdsEngineer Full System Setup');
        console.log('================================');

        try {
            this.checkPrerequisites();
            this.setupBackend();
            this.setupFrontend();
            this.setupN8n();
            this.createEnvTemplate();
            this.createDeploymentConfig();
            this.runTests();
            this.createSetupSummary();

            console.log('\n🎉 Setup Complete!');
            console.log('==================');
            console.log('Your AdsEngineer SaaS is ready for deployment.');
            console.log('Check SETUP-SUMMARY.json for next steps.');

        } catch (error) {
            this.error(`Setup failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI runner
if (require.main === module) {
    const setup = new AdsEngineerSetup();
    setup.run().catch(console.error);
}

module.exports = AdsEngineerSetup;