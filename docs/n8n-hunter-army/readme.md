# Hunter Army - Minimal Manager/Slave Setup

## Architecture Overview

```
Manager (Master)     →    Slave Workers
├── 1. Orchestrator          ├── 1. Agency Discovery
├── 2. Task Assignment          ├── 2. Tech Stack Auditing  
├── 3. Result Collection         ├── 3. Outreach Generation
└── 4. Progress Tracking          └── 4. Notification Routing
```

## Manager Workflow (`1-master-coordinator.json`)

**Purpose**: Central coordinator that:
- Dispatches hunter slaves to target agencies
- Tracks overall progress
- Collects and aggregates results
- Handles error recovery

### Manager Logic Flow

1. **Initialize Campaign**
   - Receive target criteria (agency size, tech stack, location)
   - Create campaign ID and tracking

2. **Spawn Slave Tasks**
   - For each target agency or batch:
     - Generate unique task ID
     - Assign to slave worker
     - Track in central state

3. **Monitor Progress**
   - Receive status updates from slaves
   - Handle timeouts/retries
   - Aggregate discovered agencies

4. **Compile Results**
   - Merge all slave discoveries
   - Remove duplicates
   - Rank by priority/fit
   - Export final list

## Slave Worker (`2-discovery-scout-agent.json`)

**Purpose**: Individual hunter that:
- Receives specific assignment from Manager
- Executes targeted agency discovery
- Reports findings back to Manager

### Slave Logic Flow

1. **Receive Assignment**
   - Get target: domain, company size, tech indicators
   - Acknowledge receipt with task ID

2. **Execute Discovery**
   - Web scraping & intelligence gathering
   - Tech stack detection
   - Contact info extraction
   - Save raw findings

3. **Report Back**
   - Send results to Manager webhook
   - Include: agency info, tech stack, confidence score
   - Mark task complete

## Communication Protocol

### Manager → Slave

```json
{
  "type": "assignment",
  "campaign_id": "camp_001",
  "task_id": "task_123",
  "target": {
    "domain": "example-agency.com",
    "filters": {
      "employee_count": "10-50",
      "technologies": ["wordpress", "ghl"],
      "location": "US"
    }
  },
  "webhook": "https://manager.example.com/status",
  "timeout_minutes": 30
}
```

### Slave → Manager

```json
{
  "type": "status_update",
  "campaign_id": "camp_001", 
  "task_id": "task_123",
  "status": "completed|in_progress|failed",
  "data": {
    "agency": {
      "name": "Example Agency",
      "website": "https://example-agency.com",
      "tech_stack": ["wordpress", "go-high-level", "elementor"],
      "employees": "~15",
      "contacts": ["john@example-agency.com"],
      "confidence_score": 0.85
    }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Implementation Plan

### Step 1: Create Manager Workflow

```bash
mkdir -p n8n-hunter-army/manager
cd n8n-hunter-army/manager
```

**Manager Nodes**:
1. **Webhook Trigger** - Receive campaign requests
2. **Manual Trigger** - Start new campaign
3. **Code Node** - Generate task assignments
4. **HTTP Request Nodes** - Dispatch to slaves
5. **Wait Node** - Track progress with timeout
6. **Webhook Response** - Receive slave updates
7. **Set/Filter Nodes** - Aggregate results
8. **HTTP Response** - Return final list

### Step 2: Create Slave Worker

```bash
mkdir -p n8n-hunter-army/slave
cd n8n-hunter-army/slave
```

**Slave Nodes**:
1. **Webhook Trigger** - Receive assignments
2. **Code Node** - Parse assignment & validate
3. **HTTP Request Nodes** - Web scraping & tech detection
4. **Code Node** - Process findings & score confidence
5. **HTTP Request** - Report back to Manager
6. **Set Node** - Mark task complete

### Step 3: Deployment Strategy

**Manager Deployment**:
- Host on stable instance (Railway/Render)
- Public webhook URL for slave callbacks
- Database for campaign state (optional KV)

**Slave Deployment**:
- Deploy multiple instances (Cloudflare Workers)
- Each with unique webhook URL
- Auto-scale based on task queue size

### Step 4: Scaling Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Manager      │    │  Slave Pool      │
│  (Orchestrator)│◄──►│ (Parallel        │
└─────────────────┘    │  Execution)     │
                        └──────────────────┘
```

**Benefits**:
- **Parallel Processing** - 10x faster discovery
- **Fault Tolerance** - Failed slaves don't stop campaign
- **Resource Efficient** - Scale slaves up/down as needed
- **Load Distribution** - No single point of overload

## Usage Instructions

### Launch Hunter Army Campaign

1. **Start Manager**
   ```bash
   curl -X POST https://manager.example.com/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "campaign_type": "agency_discovery",
       "targets": {
         "location": "US",
         "size": "10-50 employees",
         "technologies": ["wordpress", "ghl"]
       }
     }'
   ```

2. **Monitor Progress**
   - Manager dashboard shows active tasks
   - Real-time updates from slaves
   - Completion percentage

3. **Collect Results**
   - Manager returns ranked agency list
   - Export to CSV/JSON
   - Feed into outreach workflow

## Configuration Files

### Manager Config

```json
{
  "max_concurrent_slaves": 10,
  "task_timeout_minutes": 30,
  "retry_attempts": 3,
  "result_aggregation": {
    "duplicate_threshold": 0.8,
    "confidence_minimum": 0.7
  }
}
```

### Slave Config

```json
{
  "manager_webhook": "https://manager.example.com/status",
  "request_timeout": 10000,
  "user_agent": "HunterArmy/1.0",
  "rate_limit_delay": 2000
}
```

## Quick Start Commands

```bash
# Create directory structure
mkdir -p n8n-hunter-army/{manager,slave,config}

# Copy workflow templates
cp templates/manager.json n8n-hunter-army/manager/
cp templates/slave.json n8n-hunter-army/slave/

# Deploy manager (stable host)
cd n8n-hunter-army/manager
railway up

# Deploy slaves (Cloudflare Workers)
cd n8n-hunter-army/slave
wrangler deploy --name hunter-slave-1
wrangler deploy --name hunter-slave-2
# ... scale as needed
```

## Next Steps

1. **Build Manager workflow** - Use existing `1-master-agency-hunter-coordinator.json`
2. **Simplify Slave workflow** - Extract core logic from `2-discovery-scout-agent.json`
3. **Set up communication** - Test webhook callbacks
4. **Deploy pool** - Start with 3-5 slave workers
5. **Monitor & Scale** - Add more slaves based on performance

**Result**: Scalable agency discovery system that can handle 100+ targets simultaneously vs sequential processing.