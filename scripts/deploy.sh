#!/bin/bash

# Safe Deploy Script for ClawdSocial
# Usage: ./scripts/deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 ClawdSocial Safe Deploy${NC}"
echo ""

# Step 1: Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    git status -s
    echo ""
    read -p "Commit changes? (y/n): " should_commit
    if [ "$should_commit" = "y" ]; then
        read -p "Commit message: " msg
        git add -A
        git commit -m "$msg"
    else
        echo -e "${RED}❌ Deploy cancelled. Commit your changes first.${NC}"
        exit 1
    fi
fi

# Step 2: Type check
echo ""
echo -e "${YELLOW}🔍 Running TypeScript check...${NC}"
if ! npx tsc --noEmit; then
    echo -e "${RED}❌ TypeScript errors found!${NC}"
    echo "Fix these errors before deploying:"
    npx tsc --noEmit 2>&1 | head -20
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"

# Step 3: Build check
echo ""
echo -e "${YELLOW}🏗️  Running build check...${NC}"
if ! npm run build > /tmp/build-output.log 2>&1; then
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Last 30 lines of build output:"
    tail -30 /tmp/build-output.log
    exit 1
fi
echo -e "${GREEN}✅ Build check passed${NC}"

# Step 4: Check for common issues
echo ""
echo -e "${YELLOW}🔎 Checking for common issues...${NC}"

# Check for missing environment variables
if ! grep -q "OPENAI_API_KEY" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY not found in .env.local${NC}"
fi

# Check for console.logs in production code
if grep -r "console.log" src/app --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "error\|warn" | head -5; then
    echo -e "${YELLOW}⚠️  Found console.log statements (not critical, but consider removing)${NC}"
fi

# Step 5: Confirm deploy
echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
read -p "Deploy to production? (y/n): " confirm

if [ "$confirm" = "y" ]; then
    echo ""
    echo -e "${BLUE}🚀 Pushing to origin/main...${NC}"
    git push origin main
    echo ""
    echo -e "${GREEN}✅ Deploy triggered! Check Vercel dashboard for status.${NC}"
    echo "   Dashboard: https://vercel.com/dashboard"
else
    echo -e "${YELLOW}⚠️  Deploy cancelled${NC}"
    exit 0
fi
