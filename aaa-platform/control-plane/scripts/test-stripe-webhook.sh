#!/bin/bash

# Stripe Webhook Testing Script
# Tests webhook event handling for AAA Platform

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       AAA Platform - Stripe Webhook Test Suite            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:  brew install stripe/stripe-cli/stripe"
    echo "  Linux:  See https://stripe.com/docs/stripe-cli"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI installed"
echo ""

# Check if server is running
if ! curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
    echo "❌ Next.js server not running at http://localhost:3000"
    echo ""
    echo "Start the server first:"
    echo "  cd aaa-platform/control-plane"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✅ Next.js server is running"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo " Starting Stripe Webhook Listener"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This will:"
echo "  1. Forward Stripe webhooks to http://localhost:3000/api/webhooks/stripe"
echo "  2. Give you a webhook secret to add to .env"
echo "  3. Allow you to trigger test events"
echo ""
echo "IMPORTANT: Copy the webhook secret (whsec_...) to your .env file"
echo "           as STRIPE_WEBHOOK_SECRET before triggering events"
echo ""
echo "Press Ctrl+C to stop the listener"
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Start webhook listener (this will block)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Note: The following commands are documentation for after the listener starts
# Users should run these in a separate terminal

: <<'END_COMMENT'

After the listener starts, open a NEW terminal and run:

# Test checkout completion (Tier 2 subscription)
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test successful payment
stripe trigger invoice.payment_succeeded

# Test failed payment
stripe trigger invoice.payment_failed

# Check webhook processing in database
sqlite3 dev.db "SELECT * FROM WebhookEvent ORDER BY createdAt DESC LIMIT 5;"

# Check subscription history
sqlite3 dev.db "SELECT * FROM SubscriptionHistory ORDER BY createdAt DESC LIMIT 5;"

END_COMMENT
