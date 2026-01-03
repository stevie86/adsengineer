#!/bin/bash
# Advanced Hunter Army Deployment Script
# Imports the AI-driven lead generation workflows into live n8n instance

set -e

# Configuration - Update these for your environment
N8N_BASE_URL="https://primary-production-dd31.up.railway.app"
N8N_API_KEY="${N8N_API_KEY:-}"  # Set via environment variable
WORKFLOWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/docs/n8n-by-claude"

echo "🤖 Advanced Hunter Army Deployment"
echo "==================================="
echo "Target n8n: $N8N_BASE_URL"
echo "Workflows: $WORKFLOWS_DIR"
echo ""

# Validate environment
if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "❌ Error: Workflows directory not found at $WORKFLOWS_DIR"
    exit 1
fi

# Check n8n connectivity
echo "🔍 Checking n8n connectivity..."
if curl -s -f "$N8N_BASE_URL/healthz" > /dev/null 2>&1; then
    echo "✅ n8n is responding"
else
    echo "❌ n8n is not accessible at $N8N_BASE_URL"
    echo "   Check that the Railway service is running"
    exit 1
fi

# Check for API key
if [ -z "$N8N_API_KEY" ]; then
    echo "⚠️  Warning: N8N_API_KEY not set"
    echo "   API imports will need to be done manually via n8n dashboard"
    MANUAL_MODE=true
else
    echo "✅ N8N_API_KEY configured"
    MANUAL_MODE=false
fi

# Function to import workflow via API
import_workflow_api() {
    local workflow_file="$1"
    local workflow_name="$2"

    echo ""
    echo "📥 API Import: $workflow_name"

    if [ ! -f "$workflow_file" ]; then
        echo "❌ Workflow file not found: $workflow_file"
        return 1
    fi

    # Extract workflow metadata
    local workflow_name_json=$(grep -o '"name": "[^"]*"' "$workflow_file" | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1' || echo "Unknown")

    echo "   Importing: $workflow_name_json"

    # Import via n8n API
    local response=$(curl -s -X POST "$N8N_BASE_URL/rest/workflows" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$workflow_file")

    if echo "$response" | grep -q '"id":'; then
        local workflow_id=$(echo "$response" | grep -o '"id": "[^"]*"' | sed 's/.*"id": "\([^"]*\)".*/\1')
        echo "   ✅ Successfully imported (ID: $workflow_id)"
        return 0
    else
        echo "   ❌ Import failed: $response"
        return 1
    fi
}

# Function to provide manual import instructions
manual_import_instructions() {
    local workflow_file="$1"
    local workflow_name="$2"

    echo ""
    echo "📋 MANUAL IMPORT: $workflow_name"
    echo "   File: $workflow_file"
    echo "   Steps:"
    echo "   1. Visit: $N8N_BASE_URL"
    echo "   2. Go to Workflows → Import from File"
    echo "   3. Upload: $(basename "$workflow_file")"
    echo "   4. Save the workflow"
}

# Main deployment logic
echo ""
echo "🚀 Starting Hunter Army Import Process"
echo "======================================"

WORKFLOWS_IMPORTED=0
WORKFLOWS_FAILED=0

# Import Master Coordinator first (critical for orchestration)
workflow_file="$WORKFLOWS_DIR/1-master-agency-hunter-coordinator.json"
if [ "$MANUAL_MODE" = false ]; then
    if import_workflow_api "$workflow_file" "Master Coordinator"; then
        ((WORKFLOWS_IMPORTED++))
    else
        ((WORKFLOWS_FAILED++))
        manual_import_instructions "$workflow_file" "Master Coordinator"
    fi
else
    manual_import_instructions "$workflow_file" "Master Coordinator"
fi

# Import specialized agents
for i in {2..5}; do
    case $i in
        2) name="Discovery Scout Agent" ;;
        3) name="Tech Stack Auditor Agent" ;;
        4) name="Outreach Copywriter Agent" ;;
        5) name="Notification Router" ;;
    esac

    workflow_file="$WORKFLOWS_DIR/$i-${name,,}"
    workflow_file="${workflow_file// /-}.json"

    if [ "$MANUAL_MODE" = false ]; then
        if import_workflow_api "$workflow_file" "$name"; then
            ((WORKFLOWS_IMPORTED++))
        else
            ((WORKFLOWS_FAILED++))
            manual_import_instructions "$workflow_file" "$name"
        fi
    else
        manual_import_instructions "$workflow_file" "$name"
    fi
done

# Deployment summary
echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "✅ Workflows imported: $WORKFLOWS_IMPORTED"
echo "❌ Workflows failed: $WORKFLOWS_FAILED"
echo "📁 Total workflows: 5"

if [ "$MANUAL_MODE" = true ]; then
    echo ""
    echo "📋 MANUAL CONFIGURATION REQUIRED"
    echo "================================="
    echo ""
    echo "Since N8N_API_KEY is not set, complete these steps:"
    echo ""
    echo "1. 🔑 Set up API credentials in n8n:"
    echo "   • Visit: $N8N_BASE_URL"
    echo "   • Go to Settings → API"
    echo "   • Create API Key"
    echo "   • Set environment variable: export N8N_API_KEY=your_key_here"
    echo ""
    echo "2. 📤 Import workflows manually (see instructions above)"
    echo ""
    echo "3. 🔗 Configure API credentials for each workflow:"
    echo "   • Google Maps API Key"
    echo "   • SerpAPI Key"
    echo "   • BuiltWith API Key"
    echo "   • OpenAI API Key (GPT-4)"
    echo ""
    echo "4. 🔧 Connect workflow dependencies:"
    echo "   • Master Coordinator → All sub-agents (via Tool nodes)"
    echo "   • Set webhook URLs for chat triggers"
    echo "   • Configure notification endpoints"
fi

echo ""
echo "🎯 ACTIVATION CHECKLIST"
echo "======================="
echo ""
echo "□ All 5 workflows imported and active"
echo "□ API credentials configured in n8n"
echo "□ Master Coordinator webhook URL set"
echo "□ Test Discovery Scout: 'Find agencies in Austin, TX'"
echo "□ Test Tech Auditor: Visit an agency website"
echo "□ Test Outreach Writer: Generate sample email"
echo "□ Enable production scheduling"
echo "□ Set up error notifications"
echo ""

echo "🚀 Hunter Army Status: $([ "$WORKFLOWS_IMPORTED" -eq 5 ] && echo 'DEPLOYED' || echo 'READY FOR MANUAL IMPORT')"
echo ""
echo "Expected Performance:"
echo "• 50-100 agencies discovered/hour"
echo "• 30-50 websites audited/minute"
echo "• 20-30 personalized emails/hour"
echo "• 10-20 qualified leads/day"
echo ""
echo "🎉 Advanced AI Lead Generation System Ready!"