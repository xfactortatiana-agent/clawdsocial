#!/bin/bash

echo "🔍 Checking ClawdSocial Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env.local file
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅${NC} .env.local file exists"
else
    echo -e "${YELLOW}⚠️${NC} .env.local not found (using Vercel env vars)"
fi

echo ""
echo "Required Environment Variables:"
echo "--------------------------------"

# Check each required variable
vars=(
    "DATABASE_URL"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CLERK_SECRET_KEY"
    "X_CLIENT_ID"
    "X_CLIENT_SECRET"
    "OPENAI_API_KEY"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${vars[@]}"; do
    if grep -q "^$var=" .env.local 2>/dev/null || [ -n "${!var}" ]; then
        echo -e "${GREEN}✅${NC} $var"
    else
        echo -e "${RED}❌${NC} $var (MISSING)"
    fi
done

echo ""
echo "New Reliability Layer Variables:"
echo "---------------------------------"

new_vars=(
    "INNGEST_EVENT_KEY"
    "INNGEST_SIGNING_KEY"
    "X_WEBHOOK_SECRET"
    "RESEND_API_KEY"
)

for var in "${new_vars[@]}"; do
    if grep -q "^$var=" .env.local 2>/dev/null || [ -n "${!var}" ]; then
        echo -e "${GREEN}✅${NC} $var"
    else
        echo -e "${YELLOW}⚠️${NC} $var (recommended but optional)"
    fi
done

echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Sign up at https://www.inngest.com"
echo "2. Get your Event Key and Signing Key"
echo "3. Add them to Vercel:"
echo "   vercel env add INNGEST_EVENT_KEY"
echo "   vercel env add INNGEST_SIGNING_KEY"
echo ""
echo "4. (Optional) Set up X webhooks:"
echo "   - Go to https://developer.twitter.com/en/portal/dashboard"
echo "   - Add webhook URL: https://clawdsocial.vercel.app/api/webhooks/x"
echo "   - Add X_WEBHOOK_SECRET to Vercel"
echo ""
echo "5. Redeploy: vercel --prod"
