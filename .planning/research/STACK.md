# Technology Stack

**Project:** AdsEngineer Hybrid Architecture v1.0
**Researched:** 2026-01-26
**Focus:** Self-hosted Clawdbot orchestrator with Cloudflare Workers integration

## Recommended Stack

### Core Orchestrator Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20.x LTS | Runtime environment | Mature ecosystem, TypeScript support, long-term stability |
| TypeScript | 5.9.x | Type safety | Matches existing stack, excellent tooling, prevents runtime errors |
| Hono | 4.11.x | HTTP framework | Consistent with existing Workers API, lightweight, excellent TypeScript support |
| PM2 | 5.4.x | Process management | Production-ready clustering, zero-downtime restarts, monitoring |

### Communication & Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudflare Workers SDK | 4.59.x | Workers API access | Official SDK, service bindings, Workers VPC support |
| Cloudflare Tunnel | cloudflared 2025.x | Secure tunneling | Encrypted connections, no public exposure, zero-trust |
| WebSocket | native API | Real-time communication | Bidirectional communication, low latency, stateful connections |

### Container & Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | 27.x | Containerization | Consistent environments, easy deployment, isolation |
| Docker Compose | 2.29.x | Multi-container orchestration | Simple VPS deployment, service coordination |
| Nginx | 1.25.x | Reverse proxy | Load balancing, SSL termination, static file serving |

### Security & Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| JWT | jsonwebtoken 9.0.x | Token-based auth | Stateless, verifiable, matches existing auth patterns |
| Cryptography | @noble/hashes 1.4.x | Hashing/signatures | Zero-dependency, modern Web Crypto API, secure |
| TLS | native HTTPS | Transport security | End-to-end encryption, certificate pinning |

### Development & Monitoring
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 4.0.x | Testing framework | Matches existing stack, fast, comprehensive |
| Winston | 3.12.x | Logging | Production-ready, structured logging, multiple transports |
| Node-cron | 3.0.x | Scheduling | Reliable task scheduling, integrates with PM2 |

### Database & State
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQLite | 3.45.x | Local state storage | Lightweight, no external dependencies, perfect for orchestrator state |
| D1 (existing) | Cloudflare | Shared data | Leverages existing infrastructure, global replication |

## Integration Points with Existing Stack

### Cloudflare Workers Integration
```typescript
// Service binding for orchestrator communication
[[services]]
binding = "ORCHESTRATOR"
service = "clawdbot-service"

// Workers VPC tunnel configuration
[vpc]
tunnel_id = "orchestrator-tunnel-id"
```

### Shared Authentication Patterns
```typescript
// Compatible JWT signing across systems
import jwt from 'jsonwebtoken';
import { createHash } from '@noble/hashes/sha256';

// Same HMAC validation as Workers API
const isValidSignature = (payload: string, signature: string) => {
  const expected = createHash(payload + SECRET).toString();
  return crypto.timingSafeEqual(signature, expected);
};
```

### Database Strategy
- **Orchestrator Local**: SQLite for config, state, cached responses
- **Cloudflare D1**: Shared customer data, analytics, audit logs
- **Sync Pattern**: Bidirectional sync via Cloudflare Tunnel

## Hybrid Architecture Communication

### Secure Tunnel Setup
```bash
# On VPS (orchestrator)
cloudflared tunnel --url http://localhost:3000 --hostname orchestrator.internal

# In Workers wrangler.toml
[[services]]
binding = "ORCHESTRATOR"
service = "clawdbot-service"
```

### API Gateway Pattern
```typescript
// Worker routes to orchestrator
app.get('/api/v1/orchestrator/*', async (c) => {
  return c.env.ORCHESTRATOR.fetch(c.req);
});

// Orchestrator handles internal logic
app.post('/internal/deploy', async (c) => {
  const { workerConfig, environment } = await c.req.json();
  // Deploy to Cloudflare Workers via API
  return { success: true, deploymentId: generateId() };
});
```

## Deployment Configuration

### PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'clawdbot-orchestrator',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  orchestrator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - orchestrator
    restart: unless-stopped
```

## VPS Setup Script Requirements

### Core Dependencies
```bash
#!/bin/bash
# install-dependencies.sh

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker & Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/download/v2.29.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# PM2 global
sudo npm install -g pm2

# Cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

## Security Considerations

### Secret Management
```typescript
// Never expose Cloudflare tokens
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!CF_API_TOKEN) {
  throw new Error('Missing CLOUDFLARE_API_TOKEN');
}

// Use Workers secrets for sensitive data
const WORKER_SECRETS = await getWorkerSecrets(workerId);
```

### Network Security
- Cloudflare Tunnel provides zero-trust connectivity
- No public ports except nginx reverse proxy
- JWT-based authentication for all API endpoints
- Rate limiting at nginx and application level

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Process Manager | PM2 | systemd, forever | PM2 provides clustering, monitoring, easier for Node.js |
| Container Runtime | Docker | Podman, LXC | Docker has better ecosystem, tooling, and documentation |
| Tunnel Solution | Cloudflare Tunnel | Tailscale, WireGuard | Native Cloudflare integration, no additional clients |
| Framework | Hono | Express, Fastify | Hono matches Workers API, better TypeScript support |
| Database | SQLite | PostgreSQL, MongoDB | SQLite is sufficient for orchestrator state, zero maintenance |

## Installation

### Core Dependencies
```bash
# Runtime
npm install hono@^4.11.0 jsonwebtoken@^9.0.0 @noble/hashes@^1.4.0 winston@^3.12.0 node-cron@^3.0.0 sqlite3@^5.1.0

# Development
npm install -D @types/node@^20.0.0 typescript@^5.9.0 vitest@^4.0.0 @vitest/coverage-v8@^4.0.0

# Production
npm install -g pm2@^5.4.0
```

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd clawdbot-orchestrator
npm install

# Development with hot reload
npm run dev

# Testing
npm run test
npm run test:coverage

# Build for production
npm run build
```

### Production Deployment
```bash
# Using provided script
chmod +x deploy-vps.sh
./deploy-vps.sh

# Manual deployment
docker-compose up -d --build
pm2 start ecosystem.config.js
```

## Integration with Existing AdsEngineer Stack

### API Compatibility
```typescript
// Extend existing API patterns
interface OrchestratorRequest {
  action: 'deploy_worker' | 'update_config' | 'get_status';
  payload: unknown;
  siteId: string;
}

interface OrchestratorResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}
```

### Database Synchronization
```typescript
// Sync patterns with existing D1 schema
interface SyncEvent {
  type: 'worker_deployment' | 'config_change' | 'health_check';
  siteId: string;
  data: Record<string, unknown>;
  createdAt: string;
  syncedToWorkers: boolean;
}
```

### Monitoring Integration
```typescript
// Extend existing health check patterns
app.get('/health', async (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    workers: await getWorkersStatus(),
    tunnel: await getTunnelStatus()
  });
});
```

## Sources

- Cloudflare Workers SDK Documentation (HIGH confidence)
- PM2 Ecosystem Configuration (HIGH confidence)
- Docker Multi-stage Build Best Practices (HIGH confidence)
- Cloudflare Workers VPC Documentation (HIGH confidence)
- Node.js Production Deployment Guides (MEDIUM confidence)