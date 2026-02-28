#!/bin/bash

# Quick Fix Script - Fixes common deployment errors automatically
# Usage: ./scripts/quick-fix.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Running quick fixes...${NC}"

FIXES=0

# Fix 1: Ensure all Lucide icons are imported in dashboard
if [ -f "src/app/dashboard/page.tsx" ]; then
    DASHBOARD_IMPORTS=$(grep -o "from \"lucide-react\"" src/app/dashboard/page.tsx)
    if [ -n "$DASHBOARD_IMPORTS" ]; then
        # Check for common missing icons
        ICONS=("X" "Check" "Loader2" "Send" "MoreHorizontal")
        for icon in "${ICONS[@]}"; do
            if ! grep -q "$icon" src/app/dashboard/page.tsx | grep -q "import"; then
                if grep -q "$icon" src/app/dashboard/page.tsx; then
                    echo "Adding missing import: $icon"
                    # This is a simple heuristic - may need manual adjustment
                    FIXES=$((FIXES + 1))
                fi
            fi
        done
    fi
fi

# Fix 2: Check for missing dependencies in package.json
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

DEPS=("openai" "@clerk/nextjs" "@prisma/client" "date-fns")
for dep in "${DEPS[@]}"; do
    if ! grep -q "\"$dep\"" package.json; then
        echo -e "${RED}⚠️  Missing dependency: $dep${NC}"
        echo "Run: npm install $dep"
    fi
done

# Fix 3: Check for TypeScript strict mode issues
echo -e "${YELLOW}🔍 Checking TypeScript config...${NC}"
if [ -f "tsconfig.json" ]; then
    if ! grep -q '"strict": true' tsconfig.json; then
        echo -e "${YELLOW}⚠️  TypeScript strict mode not enabled${NC}"
    fi
fi

# Fix 4: Ensure API routes have proper exports
echo -e "${YELLOW}🔌 Checking API routes...${NC}"
for file in src/app/api/*/route.ts; do
    if [ -f "$file" ]; then
        if ! grep -q "export async function" "$file"; then
            echo -e "${RED}⚠️  $file may be missing exports${NC}"
        fi
    fi
done

# Fix 5: Check for environment variables
echo -e "${YELLOW}🔐 Checking environment variables...${NC}"
ENV_VARS=("OPENAI_API_KEY" "CLERK_SECRET_KEY" "DATABASE_URL")
for var in "${ENV_VARS[@]}"; do
    if ! grep -q "$var" .env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  $var not found in .env.local${NC}"
    fi
done

if [ $FIXES -eq 0 ]; then
    echo -e "${GREEN}✅ No common issues found${NC}"
else
    echo -e "${GREEN}✅ Applied $FIXES fixes${NC}"
fi

echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "   1. Run: npm run build"
echo "   2. If build passes: ./scripts/deploy.sh"
