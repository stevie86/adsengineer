#!/bin/bash
# AdsEngineer Manual Tracking Fallback System

echo "🔄 AdsEngineer Manual Tracking Fallback"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
FALLBACK_DIR="fallback-tracking"
CUSTOMER_ID="${1:-demo-customer}"
API_BASE="https://adsengineer-cloud.adsengineer.workers.dev"

# Create fallback directory
if [ ! -d "$FALLBACK_DIR" ]; then
    mkdir -p "$FALLBACK_DIR"
    echo -e "${GREEN}✅ Created fallback tracking directory${NC}"
fi

# Manual conversion upload function
upload_manual_conversion() {
    local gclid="$1"
    local conversion_value="$2"
    local order_id="$3"

    echo -e "${BLUE}📤 Manually uploading conversion...${NC}"
    echo "GCLID: $gclid"
    echo "Value: €$conversion_value"
    echo "Order ID: $order_id"

    # Create manual conversion record
    cat > "$FALLBACK_DIR/conversion-$(date +%s).json" << EOF
{
    "type": "manual_fallback",
    "customer_id": "$CUSTOMER_ID",
    "gclid": "$gclid",
    "conversion_value": $conversion_value,
    "order_id": "$order_id",
    "timestamp": "$(date -Iseconds)",
    "status": "pending_upload"
}
EOF

    echo -e "${GREEN}✅ Manual conversion recorded${NC}"
    echo -e "${YELLOW}⚠️  Remember to upload this to Google Ads manually${NC}"
}

# Batch upload function
batch_upload_conversions() {
    echo -e "${BLUE}📦 Processing batch conversions...${NC}"

    local count=0
    for file in "$FALLBACK_DIR"/conversion-*.json; do
        if [ -f "$file" ]; then
            echo -e "${YELLOW}Processing: $(basename "$file")${NC}"

            # Here you would implement the actual API call
            # For now, just mark as processed
            mv "$file" "${file}.processed"
            ((count++))
        fi
    done

    echo -e "${GREEN}✅ Processed $count conversions${NC}"
}

# Generate manual tracking instructions
generate_instructions() {
    cat > "$FALLBACK_DIR/MANUAL_INSTRUCTIONS.md" << 'EOF'
# Manual Conversion Tracking Instructions

## When to Use Manual Tracking
- Automated system is down/unavailable
- API credentials are invalid
- Emergency situations requiring immediate action

## Step 1: Record Conversion Data
Use the fallback script to record conversions:
```bash
./fallback-tracking.sh upload [GCLID] [VALUE] [ORDER_ID]
```

## Step 2: Manual Google Ads Upload
1. Go to Google Ads dashboard
2. Navigate to Tools & Settings > Measurement > Conversions
3. Click "Upload conversions"
4. Select "Manual upload"
5. Upload CSV with format:
```
GCLID,Conversion Name,Conversion Value,Conversion Currency,Conversion Time
EAIaIQobChMI__[GCLID]__wIVg4gIVg4gCh2JQwE,purchase,49.90,EUR,2025-01-02T10:00:00Z
```

## Step 3: Verify Upload
- Check conversion appears in Google Ads within 1-2 hours
- Verify attribution in conversion reports
- Confirm revenue tracking is working

## Step 4: Document for Reconciliation
- Keep records of all manual uploads
- Note any discrepancies with automated system
- Update when automated system is restored

## Emergency Contact
If manual tracking is needed for more than 24 hours:
- Contact AdsEngineer support immediately
- Escalate to engineering team
- Consider temporary service pause for affected customers
EOF

    echo -e "${GREEN}✅ Manual instructions generated${NC}"
}

# Main menu
case "${2:-menu}" in
    "upload")
        if [ $# -lt 5 ]; then
            echo -e "${RED}Usage: $0 <customer_id> upload <gclid> <value> <order_id>${NC}"
            exit 1
        fi
        upload_manual_conversion "$3" "$4" "$5"
        ;;
    "batch")
        batch_upload_conversions
        ;;
    "instructions")
        generate_instructions
        ;;
    "status")
        echo -e "${BLUE}📊 Fallback System Status${NC}"
        echo "Pending conversions: $(ls "$FALLBACK_DIR"/conversion-*.json 2>/dev/null | wc -l)"
        echo "Processed conversions: $(ls "$FALLBACK_DIR"/*.processed 2>/dev/null | wc -l)"
        echo "Failed uploads: $(ls "$FALLBACK_DIR"/*.failed 2>/dev/null | wc -l)"
        ;;
    "menu"|*)
        echo -e "${BLUE}🔄 AdsEngineer Manual Tracking Fallback${NC}"
        echo ""
        echo "Usage: $0 <customer_id> <command> [args...]"
        echo ""
        echo "Commands:"
        echo "  upload <gclid> <value> <order_id>    - Record manual conversion"
        echo "  batch                                 - Process pending conversions"
        echo "  instructions                          - Generate manual instructions"
        echo "  status                                - Show system status"
        echo ""
        echo "Examples:"
        echo "  $0 mycannaby upload EAIaIQobChMI__gclid__ 49.90 ORDER123"
        echo "  $0 mycannaby batch"
        echo "  $0 mycannaby status"
        ;;
esac

echo -e "\n${GREEN}🎯 Fallback system ready for emergency use${NC}"
echo -e "${YELLOW}Remember: This is for emergencies only. Restore automated system ASAP.${NC}"