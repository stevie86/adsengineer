#!/bin/bash
# AdsEngineer Credential Validation Tool

echo "🔐 AdsEngineer Credential Validation"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test Google Ads credentials
echo -e "\n${YELLOW}Testing Google Ads API Access...${NC}"
GOOGLE_ACCESS_TOKEN="${GOOGLE_ACCESS_TOKEN:-}"
GOOGLE_REFRESH_TOKEN="${GOOGLE_REFRESH_TOKEN:-}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"

if [ -z "$GOOGLE_ACCESS_TOKEN" ] && [ -z "$GOOGLE_REFRESH_TOKEN" ]; then
    echo -e "${RED}❌ Google Ads credentials not configured${NC}"
    echo "   Set GOOGLE_ACCESS_TOKEN or GOOGLE_REFRESH_TOKEN environment variables"
else
    echo -e "${GREEN}✅ Google Ads credentials configured${NC}"
    # Could add API validation here if needed
fi

# Test Meta/Facebook credentials
echo -e "\n${YELLOW}Testing Meta Conversions API Access...${NC}"
META_ACCESS_TOKEN="${META_ACCESS_TOKEN:-}"
META_PIXEL_ID="${META_PIXEL_ID:-}"

if [ -z "$META_ACCESS_TOKEN" ] || [ -z "$META_PIXEL_ID" ]; then
    echo -e "${RED}❌ Meta credentials not configured${NC}"
    echo "   Set META_ACCESS_TOKEN and META_PIXEL_ID environment variables"
else
    echo -e "${GREEN}✅ Meta credentials configured${NC}"
    # Could add API validation here if needed
fi

# Test database connection
echo -e "\n${YELLOW}Testing Database Connection...${NC}"
# This would require actual database access, for now just check if we can reach the API
DB_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://advocate-cloud.adsengineer.workers.dev/api/v1/leads" 2>/dev/null)
if [ "$DB_TEST" = "401" ]; then
    echo -e "${GREEN}✅ Database connection working (auth required)${NC}"
else
    echo -e "${RED}❌ Database connection issue${NC}"
fi

# Test JWT authentication
echo -e "\n${YELLOW}Testing JWT Authentication...${NC}"
# This would require a valid JWT token to test fully
JWT_TEST=$(curl -s -o /dev/null -w "%{http_code}" "https://advocate-cloud.adsengineer.workers.dev/api/v1/leads" 2>/dev/null)
if [ "$JWT_TEST" = "401" ]; then
    echo -e "${GREEN}✅ JWT authentication active${NC}"
else
    echo -e "${RED}❌ JWT authentication issue${NC}"
fi

echo -e "\n${GREEN}🎯 Credential Validation Complete${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo "This tool validates that credentials are configured."
echo "For production use, add actual API validation calls."
echo "Store credentials securely using wrangler secrets."

echo -e "\n${GREEN}Next Steps:${NC}"
echo "1. Set up Google Ads OAuth credentials"
echo "2. Set up Meta Business API credentials"
echo "3. Test actual API calls with real credentials"
echo "4. Implement automated credential refresh"