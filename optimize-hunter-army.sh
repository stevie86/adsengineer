#!/bin/bash
# Hunter Army Optimization Implementation
# Applies performance improvements to the deployed system

set -e

echo "⚡ Implementing Hunter Army Optimizations..."
echo ""

# 1. Railway Configuration Optimizations
echo "🏗️  Optimizing Railway Configuration..."

# Check current Railway service configuration
echo "   Current service status:"
railway service status

# Suggest memory increase if needed
echo "   💡 Consider: railway service scale memory"
echo ""

# 2. Database Optimizations
echo "🗄️  Implementing Database Optimizations..."

# Add database indexes for better query performance
# Note: This would need to be run via Railway CLI or direct DB access

cat << 'DB_OPTIMIZATIONS'
-- Recommended Database Optimizations:

-- Add composite indexes for lead queries
CREATE INDEX IF NOT EXISTS idx_leads_org_gclid ON leads(org_id, gclid);
CREATE INDEX IF NOT EXISTS idx_leads_created_gclid ON leads(created_at, gclid);

-- Add partial indexes for active leads
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(status) WHERE status = 'new';

-- Optimize waitlist queries
CREATE INDEX IF NOT EXISTS idx_waitlist_created_email ON waitlist(created_at, email);

-- Add indexes for audit logs (performance)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
DB_OPTIMIZATIONS

echo "   ✅ Database optimization recommendations generated"
echo ""

# 3. n8n Configuration Optimizations
echo "🤖 Optimizing n8n Configuration..."

cat > n8n-performance-config.env << 'N8N_CONFIG'
# Performance Optimizations for n8n
EXECUTIONS_TIMEOUT=3600000
EXECUTIONS_DATA_PRUNE_TIMEOUT=1680000
EXECUTIONS_DATA_MAX_AGE=1680000

# Queue Optimizations
QUEUE_BULL_REDIS_DB=1
QUEUE_BULL_REDIS_TIMEOUT_FACTOR=2
QUEUE_BULL_REDIS_COMMAND_TIMEOUT=8000

# Memory Optimizations
NODE_OPTIONS=--max_old_space_size=16384

# Workflow Optimizations
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
N8N_BINARY_DATA_TTL=1680000
N8N_PERSISTED_BINARY_DATA_TTL=604800000

# API Rate Limiting (if available)
N8N_REST_API_RATE_LIMIT=100
N8N_REST_API_RATE_WINDOW=900000
N8N_CONFIG_FILES_ENABLED=true
N8N_EXTERNAL_HOOKS_FILE_ENABLED=true
N8N_EXTERNAL_SECRETS_ENABLED=true
N8N_CUSTOM_EXTENSIONS_ENABLED=true
N8N_WORKFLOW_TAGS_DISABLED=false
N8N_BINARY_DATA_MODE=filesystem
N8N_EXECUTIONS_MODE=queue
N8N_EXECUTIONS_PROCESS=main
N8N_QUEUES_MODE=auto
N8N_REDIS_SENTINEL_MASTER_NAME=
N8N_REDIS_SENTINEL_MASTER_PASSWORD=
N8N_REDIS_SENTINEL_NODES=
N8N_REDIS_CLUSTER_NODES=
N8N_REDIS_CLUSTER_PASSWORD=
N8N_DIAGNOSTICS_ENABLED=true
N8N_DIAGNOSTICS_CONFIG_FRONTEND=database
N8N_DIAGNOSTICS_CONFIG_BACKEND=database
N8N_DIAGNOSTICS_CONFIG_WORKFLOW_EXECUTIONS=database
N8N_HIRING_BANNER_ENABLED=false
N8N_TEMPLATES_ENABLED=false
N8N_ONBOARDING_FLOW_DISABLED=true
N8N_VERSION_NOTIFICATIONS_ENABLED=false
N8N_PERSONALIZATION_ENABLED=false
N8N_WORKFLOW_HISTORY_ENABLED=false
