#!/bin/bash

# Stripe Checkout Testing Script
# Tests all pricing tiers for AAA Platform

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         AAA Platform - Stripe Checkout Test Suite         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
API_ENDPOINT="$BASE_URL/api/checkout"

echo "Testing against: $API_ENDPOINT"
echo "Note: You must be signed in with valid Clerk session"
echo ""

# Check if server is running
if ! curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo "❌ Error: Server not running at $BASE_URL"
    echo "   Start the server first: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Function to test checkout
test_checkout() {
    local tier=$1
    local price_id=$2
    local name=$3

    echo "───────────────────────────────────────────────────────────"
    echo "Testing: $name"
    echo "Tier: $tier | Price ID: $price_id"
    echo ""

    response=$(curl -s -X POST "$API_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "{\"tier\": \"$tier\", \"priceId\": \"$price_id\"}" \
        -w "\n%{http_code}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        url=$(echo "$body" | grep -o '"url":"[^"]*' | cut -d'"' -f4)
        if [ -n "$url" ]; then
            echo "✅ SUCCESS - Checkout session created"
            echo "   URL: $url"
        else
            echo "⚠️  WARNING - Got 200 but no URL in response"
            echo "   Response: $body"
        fi
    elif [ "$http_code" = "401" ]; then
        echo "🔒 UNAUTHORIZED - Please sign in to Clerk first"
        echo "   Visit: $BASE_URL/sign-in"
    elif [ "$http_code" = "400" ]; then
        echo "❌ BAD REQUEST - Check if price IDs are configured"
        echo "   Response: $body"
    else
        echo "❌ FAILED - HTTP $http_code"
        echo "   Response: $body"
    fi
    echo ""
}

# Test all pricing tiers
echo "═══════════════════════════════════════════════════════════"
echo " Testing Tier 2: Core Subscription Plans"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Read price IDs from .env if available
if [ -f ".env" ]; then
    source .env
fi

# Tier 2A - Individual ($99/month)
TIER2_99="${STRIPE_PRICE_TIER2_MONTHLY_99:-price_xxxxxxxxxxxxx}"
test_checkout "tier2" "$TIER2_99" "Tier 2A - Individual (\$99/month)"

# Tier 2B - Team ($199/month)
TIER2_199="${STRIPE_PRICE_TIER2_MONTHLY_199:-price_xxxxxxxxxxxxx}"
test_checkout "tier2" "$TIER2_199" "Tier 2B - Team (\$199/month)"

echo "═══════════════════════════════════════════════════════════"
echo " Testing Tier 3: Apex Implementation Services"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Tier 3A - Single Project ($2,500)
TIER3_2500="${STRIPE_PRICE_TIER3_ONETIME_2500:-price_xxxxxxxxxxxxx}"
test_checkout "tier3" "$TIER3_2500" "Tier 3A - Single Project (\$2,500)"

# Tier 3B - Complete Transformation ($5,000)
TIER3_5000="${STRIPE_PRICE_TIER3_ONETIME_5000:-price_xxxxxxxxxxxxx}"
test_checkout "tier3" "$TIER3_5000" "Tier 3B - Complete Transformation (\$5,000)"

echo "═══════════════════════════════════════════════════════════"
echo " Testing Legacy Naming (Backward Compatibility)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test legacy "architect" naming
test_checkout "architect" "" "Legacy: Architect Plan (should use TIER2_MONTHLY_99)"

# Test legacy "apex" naming
test_checkout "apex" "" "Legacy: Apex Plan (should use TIER3_ONETIME_2500)"

echo "═══════════════════════════════════════════════════════════"
echo " Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "If you see 401 errors, you need to:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Visit $BASE_URL/sign-in"
echo "  3. Sign in with Clerk"
echo "  4. Run this script again"
echo ""
echo "If you see 'Price ID not configured' errors:"
echo "  1. Create products in Stripe Dashboard (Test Mode)"
echo "  2. Copy the Price IDs"
echo "  3. Add them to your .env file"
echo "  4. Run this script again"
echo ""
echo "To test actual payments:"
echo "  1. Click on a checkout URL from above"
echo "  2. Use test card: 4242 4242 4242 4242"
echo "  3. Expiry: any future date (12/34)"
echo "  4. CVC: any 3 digits (123)"
echo ""
echo "Next steps:"
echo "  - Complete TASK-006: Stripe Webhook Handler"
echo "  - Test webhook events with: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
