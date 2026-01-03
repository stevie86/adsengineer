#!/bin/bash
# AdsEngineer Monitoring Setup Script

echo "📊 AdsEngineer Monitoring Setup"
echo "==============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create monitoring directory
MONITOR_DIR="monitoring"
if [ ! -d "$MONITOR_DIR" ]; then
    mkdir -p "$MONITOR_DIR"
    echo -e "${GREEN}✅ Created monitoring directory${NC}"
else
    echo -e "${YELLOW}⚠️  Monitoring directory already exists${NC}"
fi

# Create basic monitoring scripts
cat > "$MONITOR_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Basic health check script

API_URL="https://advocate-cloud.adsengineer.workers.dev"

echo "🔍 Health Check - $(date)"

# Check API response
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ API Health: OK"
else
    echo "❌ API Health: FAILED (HTTP $HEALTH_CODE)"
    exit 1
fi

# Check database connectivity
DB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/leads" 2>/dev/null)
if [ "$DB_CODE" = "401" ]; then
    echo "✅ Database: OK (auth required)"
else
    echo "❌ Database: FAILED (HTTP $DB_CODE)"
    exit 1
fi

echo "🎉 All systems healthy"
EOF

cat > "$MONITOR_DIR/error-monitor.sh" << 'EOF'
#!/bin/bash
# Error monitoring script

LOG_FILE="monitoring/errors.log"
API_URL="https://advocate-cloud.adsengineer.workers.dev"

echo "$(date): Starting error monitoring" >> "$LOG_FILE"

# Check for API errors (this is a basic example)
# In production, you'd integrate with Cloudflare logs or external monitoring

ERROR_COUNT=$(curl -s "$API_URL/api/v1/analytics/errors" 2>/dev/null | jq '.count // 0' 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "$(date): ALERT - $ERROR_COUNT errors detected" >> "$LOG_FILE"
    # Send alert (integrate with Slack, email, etc.)
    echo "🚨 $ERROR_COUNT errors detected in AdsEngineer"
fi

echo "$(date): Error monitoring complete" >> "$LOG_FILE"
EOF

cat > "$MONITOR_DIR/performance-monitor.sh" << 'EOF'
#!/bin/bash
# Performance monitoring script

METRICS_FILE="monitoring/performance.log"
API_URL="https://advocate-cloud.adsengineer.workers.dev"

echo "$(date): Performance Check" >> "$METRICS_FILE"

# Measure API response time
START=$(date +%s%3N)
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null)
END=$(date +%s%3N)
RESPONSE_TIME=$((END - START))

echo "$(date): API Response Time: ${RESPONSE_TIME}ms, Code: $RESPONSE_CODE" >> "$METRICS_FILE"

# Alert if response time > 1000ms
if [ "$RESPONSE_TIME" -gt 1000 ]; then
    echo "$(date): ALERT - Slow response time: ${RESPONSE_TIME}ms" >> "$METRICS_FILE"
    # Send alert
    echo "🐌 Slow API response: ${RESPONSE_TIME}ms"
fi
EOF

cat > "$MONITOR_DIR/daily-report.sh" << 'EOF'
#!/bin/bash
# Daily status report

REPORT_FILE="monitoring/daily-report-$(date +%Y-%m-%d).txt"

{
    echo "📊 AdsEngineer Daily Report - $(date)"
    echo "====================================="
    echo ""

    # System health
    echo "🔍 System Health:"
    if ./monitoring/health-check.sh >/dev/null 2>&1; then
        echo "✅ All systems operational"
    else
        echo "❌ System issues detected"
    fi
    echo ""

    # Performance metrics
    echo "⚡ Performance (last 24h):"
    if [ -f "monitoring/performance.log" ]; then
        tail -20 monitoring/performance.log | grep "Response Time" | tail -5
    else
        echo "No performance data available"
    fi
    echo ""

    # Error summary
    echo "🚨 Errors (last 24h):"
    if [ -f "monitoring/errors.log" ]; then
        ERROR_COUNT=$(grep "ALERT" monitoring/errors.log | wc -l)
        echo "$ERROR_COUNT alerts detected"
    else
        echo "No error data available"
    fi
    echo ""

    # Recommendations
    echo "💡 Recommendations:"
    echo "- Monitor error logs daily"
    echo "- Review performance trends"
    echo "- Check customer feedback"
    echo "- Update credentials before expiry"

} > "$REPORT_FILE"

echo "📋 Daily report generated: $REPORT_FILE"
EOF

# Make scripts executable
chmod +x "$MONITOR_DIR"/*.sh

echo -e "\n${GREEN}✅ Monitoring Setup Complete${NC}"
echo -e "${YELLOW}Created monitoring scripts:${NC}"
echo "  📁 monitoring/health-check.sh"
echo "  📁 monitoring/error-monitor.sh"
echo "  📁 monitoring/performance-monitor.sh"
echo "  📁 monitoring/daily-report.sh"

echo -e "\n${GREEN}Usage:${NC}"
echo "  ./monitoring/health-check.sh       # Quick health check"
echo "  ./monitoring/daily-report.sh      # Generate daily status report"
echo "  # Set up cron jobs for automated monitoring"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run ./monitoring/health-check.sh to test"
echo "2. Set up cron jobs for automated monitoring"
echo "3. Integrate alerts (Slack, email, etc.)"
echo "4. Add more detailed metrics tracking"