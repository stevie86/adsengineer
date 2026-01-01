#!/bin/bash

set -e

echo "🔍 Running API Compatibility Tests..."

# Test Google Ads API compatibility
test_google_ads_api() {
    echo "Testing Google Ads API..."
    curl -s "https://googleads.googleapis.com/$GOOGLE_ADS_VERSION/customers/$CUSTOMER_ID:uploadClickConversions" \
         -H "Authorization: Bearer $ACCESS_TOKEN" \
         -H "developer-token: $DEVELOPER_TOKEN" \
         -X POST \
         -d '{"conversions": []}' \
         --connect-timeout 10 \
         --max-time 30 > /tmp/google_ads_test.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Google Ads API v$GOOGLE_ADS_VERSION - OK"
    else
        echo "❌ Google Ads API v$GOOGLE_ADS_VERSION - FAILED"
        cat /tmp/google_ads_test.json
        exit 1
    fi
}

# Test GHL webhook format
test_ghl_webhook() {
    echo "Testing GHL Webhook compatibility..."
    webhook_payload='{
        "contact": {
            "id": "test_contact_123",
            "email": "test@example.com",
            "phone": "+1234567890",
            "customField": {
                "gclid": "EAIaIQv3i3m8e7vOZ-1572532743",
                "utm_source": "google",
                "utm_medium": "cpc"
            }
        },
        "locationId": "loc_test_456"
    }'
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-GHL-Signature: $(echo -n "$webhook_payload" | openssl sha256 -hmac "$GHL_WEBHOOK_SECRET" | cut -d' ' -f2)" \
        -d "$webhook_payload" \
        "$API_ENDPOINT/api/v1/ghl/webhook")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ GHL Webhook format - OK"
    else
        echo "❌ GHL Webhook format - FAILED"
        echo "$response"
        exit 1
    fi
}

# Test D1 database schema compatibility
test_database_schema() {
    echo "Testing D1 Database schema..."
    tables=$(wrangler d1 execute $DB_NAME --remote --command "SELECT name FROM sqlite_master WHERE type='table'" | jq -r '.[].name')
    
    required_tables=("leads" "agencies" "audit_logs" "waitlist")
    
    for table in "${required_tables[@]}"; do
        if echo "$tables" | grep -q "^$table$"; then
            echo "✅ Table '$table' exists"
        else
            echo "❌ Missing table '$table'"
            exit 1
        fi
    done
}

# Test conversion action format
test_conversion_action() {
    echo "Testing Google Ads Conversion Action format..."
    conversion_payload='{
        "conversions": [{
            "conversion_action": "customers/'$CUSTOMER_ID'/conversionActions/'$CONVERSION_ACTION_ID'",
            "gclid": "EAIaIQv3i3m8e7vOZ-1572532743",
            "conversion_date_time": "'$(date -u +%Y-%m-%d %H:%M:%S+00:00)'",
            "conversion_value": 150.00,
            "currency_code": "USD"
        }]
    }'
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "developer-token: $DEVELOPER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$conversion_payload" \
        "https://googleads.googleapis.com/v$GOOGLE_ADS_VERSION/customers/$CUSTOMER_ID:uploadClickConversions")
    

    if echo "$response" | grep -q '"partialFailureError":null\|"results":\['; then
        echo "✅ Conversion Action format - OK"
    else
        echo "❌ Conversion Action format - FAILED"
        echo "$response"
        exit 1
    fi
}

# Check for API deprecations
check_api_deprecations() {
    echo "Checking for API deprecations..."
    google_ads_response=$(curl -s "https://developers.google.com/google-ads/api/docs/release-notes")
    
    if echo "$google_ads_response" | grep -i "deprecat"; then
        echo "⚠️  Google Ads API deprecation notice found"
    else
        echo "✅ No Google Ads API deprecations"
    fi
    

}


main() {
    echo "Starting API compatibility checks..."
    echo "====================================="
    
    test_google_ads_api
    test_ghl_webhook
    test_database_schema
    test_conversion_action
    check_api_deprecations
    
    echo "====================================="
    echo "✅ All API compatibility tests passed!"
}


if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi