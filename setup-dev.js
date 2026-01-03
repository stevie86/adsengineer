#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * Sets up the complete development environment for AdsEngineer
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevSetup {
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

    // Check prerequisites
    checkPrerequisites() {
        this.log('Checking prerequisites...');

        const requiredCommands = ['node', 'npm', 'git'];
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

    // Setup backend
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

    // Setup frontend
    setupFrontend() {
        this.log('Setting up frontend...');

        process.chdir(this.frontendDir);

        // Install dependencies
        this.log('Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        // Build to check everything works
        this.log('Building frontend...');
        execSync('npm run build', { stdio: 'inherit' });

        this.success('Frontend setup complete');
    }

    // Setup Git hooks
    setupGitHooks() {
        this.log('Setting up Git hooks...');

        const huskyDir = path.join(this.rootDir, '.husky');
        if (!fs.existsSync(huskyDir)) {
            fs.mkdirSync(huskyDir);
        }

        // Create pre-commit hook
        const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and tests
cd serverless && pnpm lint && pnpm test:run
cd ../frontend && npm run lint && npm run test:run
`;

        fs.writeFileSync(path.join(huskyDir, 'pre-commit'), preCommitHook);
        execSync('chmod +x .husky/pre-commit', { cwd: this.rootDir });

        this.success('Git hooks setup complete');
    }

    // Create environment template
    createEnvTemplate() {
        this.log('Creating environment template...');

        const envTemplate = `# AdsEngineer Development Environment
# Copy this to your local .env files

# Backend (serverless/.env)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_STARTER_PRICE_ID=price_starter_id
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_id
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_char_encryption_key

# Frontend (frontend/.env.local)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_BASE_URL=http://localhost:8090
`;

        fs.writeFileSync(path.join(this.rootDir, '.env.example'), envTemplate);
        this.success('Environment template created: .env.example');
    }

    // Create development documentation
    createDevDocs() {
        const devDocs = `# Development Guide

## Getting Started

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ads-engineer
   \`\`\`

2. **Set up development environment**
   \`\`\`bash
   npm run setup:dev
   \`\`\`

3. **Start development servers**
   \`\`\`bash
   # Backend (Terminal 1)
   cd serverless && pnpm dev

   # Frontend (Terminal 2)
   cd frontend && npm run dev
   \`\`\`

## Available Scripts

### Backend (serverless/)
- \`pnpm dev\` - Start development server
- \`pnpm test\` - Run tests
- \`pnpm test:coverage\` - Run tests with coverage
- \`pnpm lint\` - Lint code
- \`pnpm format\` - Format code
- \`pnpm types:check\` - TypeScript type checking

### Frontend (frontend/)
- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run lint\` - Lint code
- \`npm run format\` - Format code

### Root
- \`npm run setup:dev\` - Set up development environment
- \`npm run test:all\` - Run all tests
- \`npm run lint:all\` - Lint all code
- \`npm run format:all\` - Format all code

## Code Quality

### Linting
- ESLint for JavaScript/TypeScript
- Configured for both backend and frontend
- Run \`npm run lint:all\` before committing

### Formatting
- Prettier for consistent code formatting
- Configured for both backend and frontend
- Run \`npm run format:all\` to format all files

### Testing
- Vitest for both backend and frontend
- Backend: 84 tests covering API, business logic
- Frontend: Component and integration tests
- Coverage reporting available

## Environment Setup

1. Copy \`.env.example\` to appropriate locations
2. Set up Stripe test accounts
3. Configure Cloudflare Workers (for backend testing)
4. Set up test databases if needed

## Git Workflow

- Pre-commit hooks ensure code quality
- Branch naming: \`feature/xxx\`, \`bugfix/xxx\`, \`hotfix/xxx\`
- Pull requests require:
  - All tests passing
  - Code review
  - No linting errors

## Architecture

### Backend
- Cloudflare Workers + Hono framework
- TypeScript for type safety
- D1 database for data persistence
- RESTful API design

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- Check existing issues first
- Use descriptive commit messages
- Follow the existing code patterns
- Add tests for new features
`;

        fs.writeFileSync(path.join(this.rootDir, 'DEVELOPMENT.md'), devDocs);
        this.success('Development documentation created: DEVELOPMENT.md');
    }

    // Create root package.json for convenience scripts
    createRootScripts() {
        const rootPackage = {
            "name": "adsengineer-monorepo",
            "private": true,
            "scripts": {
                "setup:dev": "node setup-dev.js",
                "test:all": "cd serverless && pnpm test && cd ../frontend && npm test",
                "lint:all": "cd serverless && pnpm lint && cd ../frontend && npm run lint",
                "format:all": "cd serverless && pnpm format && cd ../frontend && npm run format",
                "build:all": "cd serverless && pnpm types:check && cd ../frontend && npm run build",
                "clean": "cd serverless && rm -rf node_modules dist && cd ../frontend && rm -rf node_modules dist"
            }
        };

        fs.writeFileSync(path.join(this.rootDir, 'package.json'), JSON.stringify(rootPackage, null, 2));
        this.success('Root package.json created with convenience scripts');
    }

    // Main setup process
    async run() {
        console.log('🚀 AdsEngineer Development Environment Setup');
        console.log('=============================================');

        try {
            this.checkPrerequisites();
            this.setupBackend();
            this.setupFrontend();
            this.setupGitHooks();
            this.createEnvTemplate();
            this.createDevDocs();
            this.createRootScripts();

            console.log('\n🎉 Development Environment Setup Complete!');
            console.log('===========================================');
            console.log('Next steps:');
            console.log('1. Copy .env.example to set up your environment variables');
            console.log('2. Run: npm run test:all (to verify everything works)');
            console.log('3. Start development: cd serverless && pnpm dev');
            console.log('\nCheck DEVELOPMENT.md for detailed instructions.');

        } catch (error) {
            this.error(`Setup failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI runner
if (require.main === module) {
    const setup = new DevSetup();
    setup.run().catch(console.error);
}

module.exports = DevSetup;