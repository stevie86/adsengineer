# Hunter Army - Bulk Onboarding Guide

## Overview

Bulk onboarding lets you process hundreds of target agencies simultaneously by deploying multiple slave workers with different configurations and target lists.

## Architecture for Bulk Processing

```
┌─────────────────────────────────────────────────────────┐
│                Manager (Orchestrator)                │
│  ┌──────────────────────────────────────────────┐      │
│  │  Campaign Bulk Loader                 │      │
│  │  ├─ Load 1000 domains               │      │
│  │  ├─ Split into batches of 50          │      │
│  │  └─ Distribute to slave pool        │      │
│  └──────────────────────────────────────────────┘      │
│                   │                                   │
│                   ▼                                   │
│  ┌─────────────────────────────────┐             │
│  │    Slave Workers (100)        │◄──────────────┤
│  │  ├─ slave-01..slave-100    │  Assignments  │
│  │  ├─ 10 per batch             │  & Results     │
│  │  └─ Parallel processing       │               │
│  └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

## Bulk Onboarding Methods

### 1. **CSV File Upload**
```csv
domain,company_name,employee_count,location,priority
example-agency.com,Example Agency,15-50,US,high
test-marketing.com,Test Marketing,5-10,EU,medium
another-agency.io,Another Agency,50+,US,low
```

### 2. **API Bulk Import**
```json
{
  "bulk_campaign": {
    "name": "Q1 Agency Outreach 2025",
    "targets": [
      {
        "domain": "agency1.com",
        "filters": {
          "employee_range": "10-25",
          "technologies": ["wordpress", "ghl"],
          "location": "US",
          "priority": "high"
        }
      }
    ]
  },
  "deployment": {
    "slave_count": 20,
    "batch_size": 50,
    "parallel_processing": true
  }
}
```

### 3. **Database Query Integration**
```json
{
  "source": "crm_database",
  "query": "SELECT * FROM prospects WHERE created_at > '2025-01-01' AND status = 'uncontacted'",
  "auto_assign": true,
  "deployment_config": {
    "slaves_per_batch": 15,
    "timeout_minutes": 45
  }
}
```

## Enhanced Manager Workflow (`manager-bulk.json`)

### Additional Nodes for Bulk Operations

```json
{
  "name": "Hunter Army Manager - Bulk Operations",
  "nodes": [
    {
      "name": "Bulk CSV Upload",
      "type": "n8n-nodes-base.webhook",
      "path": "bulk-upload",
      "parameters": {
        "httpMethod": "POST"
      }
    },
    {
      "name": "Parse CSV Data",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Parse uploaded CSV and validate\nconst csvData = $input.first().json.data;\nconst targets = csvData.map(row => ({\n  domain: row.domain.trim().toLowerCase(),\n  company: row.company_name?.trim(),\n  filters: {\n    employee_range: row.employee_count,\n    technologies: row.technologies ? row.technologies.split(',').map(t => t.trim()) : [],\n    location: row.location?.trim(),\n    priority: row.priority || 'medium'\n  },\n  priority_score: row.priority === 'high' ? 3 : row.priority === 'medium' ? 2 : 1\n}));\n\nreturn [{ json: { targets, total: targets.length } }];"
      }
    },
    {
      "name": "Create Batches",
      "type": "n8n-nodes-base.code", 
      "parameters": {
        "jsCode": "// Split targets into batches for parallel processing\nconst { targets, batch_size = 50 } = $input.first().json;\nconst batches = [];\nfor (let i = 0; i < targets.length; i += batch_size) {\n  batches.push(targets.slice(i, i + batch_size));\n}\nreturn [{ json: { batches, totalBatches: batches.length } }];"
      }
    },
    {
      "name": "Deploy Slave Pool",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Deploy slaves to handle batches\nconst { batches, slave_count = 20 } = $input.first().json;\nconst slavesNeeded = Math.min(slave_count, batches.length);\nconst assignments = [];\n\nfor (let i = 0; i < slavesNeeded; i++) {\n  assignments.push({\n    slave_id: `hunter-slave-${i + 1}`,\n    webhook_url: `https://hunter-slave-${i + 1}.your-subdomain.workers.dev/assignment`,\n    batches: batches.filter((_, index) => index % slavesNeeded === i)\n  });\n}\n\nreturn [{ json: { deployments: assignments, slavesDeployed: slavesNeeded } }];"
      }
    },
    {
      "name": "Distribute Batches",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "batchSize": 10,
        "body": {
          "type": "bulk_assignment",
          "campaign_id": "={{ $json.campaign_id }}",
          "batches": "={{ $json.batches }}",
          "slave_webhook": "https://your-manager.example.com/bulk-status"
        }
      }
    },
    {
      "name": "Track Bulk Progress",
      "type": "n8n-nodes-base.webhook",
      "path": "bulk-status"
    }
  ]
}
```

## Slave Worker - Bulk Mode (`slave-bulk.json`)

Enhanced slave that can handle multiple assignments:

```json
{
  "name": "Hunter Slave - Bulk Capable",
  "nodes": [
    {
      "name": "Receive Bulk Assignment",
      "type": "n8n-nodes-base.webhook",
      "path": "bulk-assignment"
    },
    {
      "name": "Process Assignment Queue",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Handle multiple target assignments\nconst assignments = $input.first().json.batches || [];\nconst results = [];\n\nfor (const assignment of assignments) {\n  const results = await processAssignment(assignment);\n  results.push(...results);\n}\n\nreturn [{ json: { processed: results.length, agencies: results } }];"
      }
    },
    {
      "name": "Bulk Report Back",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $json.manager_webhook }}",
        "method": "POST",
        "body": {
          "type": "bulk_complete",
          "slave_id": "={{ $json.slave_id }}",
          "campaign_id": "={{ $json.campaign_id }}",
          "results": "={{ $json.agencies }}",
          "processed_count": "={{ $json.processed }}",
          "timestamp": "={{ $now }}"
        }
      }
    }
  ]
}
```

## Deployment Strategies

### **Auto-Scaling with Cloudflare Workers**

```bash
#!/bin/bash
# Deploy 100 slave workers automatically

SLAVE_COUNT=100
BATCH_SIZE=1  # Deploy in batches to avoid rate limits

for ((i=1; i<=SLAVE_COUNT; i++)); do
    if (( i % BATCH_SIZE == 0 )); then
        echo "Deploying batch $((i/BATCH_SIZE)) - slaves $((i-BATCH_SIZE+1)) to $i"
        sleep 5  # Brief pause between batches
    fi
    
    # Deploy individual slave
    cat > wrangler-$i.toml << EOF
name = "hunter-slave-$i"
main = "src/index.js"
compatibility_date = "2024-11-01"
EOF
    
    wrangler deploy --config wrangler-$i.toml &
    
    if (( i % 10 == 0 )); then
        wait  # Wait for current batch to finish
    fi
done

wait  # Wait for all background jobs
echo "✅ Deployed $SLAVE_COUNT slave workers"
```

### **Load Balancer Configuration**

```javascript
// Simple load balancer for slave assignment
const assignToSlave = (targets, availableSlaves) => {
  // Sort by current load (fewest active assignments)
  const sortedSlaves = availableSlaves.sort((a, b) => 
    a.activeAssignments - b.activeAssignments
  );
  
  return targets.map((target, index) => ({
    slave: sortedSlaves[index % sortedSlaves.length],
    target,
    assignmentId: `assign_${Date.now()}_${index}`
  }));
};
```

## Monitoring & Analytics

### **Bulk Campaign Dashboard**

```json
{
  "campaign_stats": {
    "total_targets": 1000,
    "processed": 847,
    "completed": 782,
    "failed": 65,
    "avg_processing_time": "2.3 minutes",
    "slaves_deployed": 50,
    "active_slaves": 42,
    "success_rate": "92.3%"
  },
  "real_time_metrics": {
    "current_rps": 124.5,
    "error_rate": "0.8%",
    "estimated_completion": "14 minutes"
  }
}
```

### **Automated Reporting**

```json
{
  "report_config": {
    "frequency": "5m",
    "channels": ["email", "slack", "webhook"],
    "format": {
      "summary": true,
      "detailed_results": true,
      "performance_metrics": true
    },
    "auto_export": {
      "csv": true,
      "json": true,
      "crm_integration": true
    }
  }
}
```

## Quick Start Bulk Campaign

```bash
# 1. Upload target list
curl -X POST https://your-manager.railway.app/bulk-upload \
  -F "file=@target_agencies.csv" \
  -F "campaign_name=Q1 Outreach 2025"

# 2. Deploy large slave pool
./deploy-bulk-slaves.sh --count 100 --batch-size 5

# 3. Monitor progress
curl https://your-manager.railway.app/campaign-stats/camp_001
```

## Performance Optimizations

### **Parallel Processing**
- **Batch Size**: 50 targets per slave
- **Concurrent Slaves**: 20-50 active at once
- **Processing Rate**: ~200 agencies/minute total

### **Error Handling**
- **Retry Logic**: 3 attempts per target
- **Fallback Slaves**: Backup pool for failed assignments
- **Circuit Breaker**: Pause on >10% error rate

### **Rate Limiting**
- **Delays**: 2s between requests per domain
- **User Agents**: Rotate 10 different agents
- **IP Rotation**: Use multiple proxy endpoints

## Scaling Costs

### **Cloudflare Workers (100 slaves)**
- **Requests**: 1M total = $0 (within free tier)
- **CPU Time**: 400k GB-seconds = $0 (within free tier)
- **Storage**: KV for state = $0 (within free tier)
- **Monthly Cost**: **$0**

### **Manager (Railway)**
- **Basic Plan**: ~$5/month
- **Processing**: 1000 targets = ~$0.50
- **Total Monthly**: ~$5.50

## Bulk Onboarding Checklist

- [ ] Prepare target data (CSV/JSON/API)
- [ ] Configure batch sizes and timeouts
- [ ] Deploy manager with bulk endpoints
- [ ] Deploy large slave pool (20-100 workers)
- [ ] Set up monitoring dashboard
- [ ] Configure automated reporting
- [ ] Test with small batch first
- [ ] Scale to full campaign

## Expected Performance

**With 50 slave workers processing 1000 targets:**
- **Parallel Processing**: ~20 targets simultaneously
- **Total Time**: ~15-20 minutes
- **Success Rate**: 85-95% (with retries)
- **Cost Efficiency**: Near-zero with Cloudflare Workers

**This transforms sequential agency discovery (hours/days) into parallel processing (minutes).**