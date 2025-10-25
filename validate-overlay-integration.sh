#!/bin/bash

# Unified Overlay System - Quick Validation Script
# This script validates that all integration files are in place

echo "🔍 Unified Overlay System Integration - File Validation"
echo "========================================================"
echo ""

# Track validation status
ERRORS=0

# Check frontend components
echo "📦 Checking Frontend Components..."
if [ -f "src/components/OverlayGrid.tsx" ]; then
    echo "  ✅ OverlayGrid.tsx exists"
else
    echo "  ❌ OverlayGrid.tsx NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src/components/OverlayEditModal.tsx" ]; then
    echo "  ✅ OverlayEditModal.tsx exists"
else
    echo "  ❌ OverlayEditModal.tsx NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check overlay template
echo "🎨 Checking Overlay Template..."
if [ -f "public/unified-overlay.html" ]; then
    echo "  ✅ unified-overlay.html exists"
    
    # Check if overlayId is configured
    if grep -q "overlayId: null" public/unified-overlay.html; then
        echo "  ⚠️  WARNING: overlayId is still null - needs configuration"
    else
        echo "  ✅ overlayId appears to be configured"
    fi
else
    echo "  ❌ unified-overlay.html NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check SQL migration
echo "💾 Checking Database Migration..."
if [ -f "unified-overlay-system-integration/backend/sql-scripts/01_unified_overlay_migration.sql" ]; then
    echo "  ✅ SQL migration file exists"
    LINE_COUNT=$(wc -l < "unified-overlay-system-integration/backend/sql-scripts/01_unified_overlay_migration.sql")
    echo "  📄 Migration file: $LINE_COUNT lines"
else
    echo "  ❌ SQL migration file NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check edge functions
echo "⚡ Checking Edge Functions..."
if [ -f "unified-overlay-system-integration/backend/edge-functions/get-overlays/index.ts" ]; then
    echo "  ✅ get-overlays function exists"
else
    echo "  ❌ get-overlays function NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "unified-overlay-system-integration/backend/edge-functions/update-overlay/index.ts" ]; then
    echo "  ✅ update-overlay function exists"
else
    echo "  ❌ update-overlay function NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "unified-overlay-system-integration/backend/edge-functions/create-overlay-template/index.ts" ]; then
    echo "  ✅ create-overlay-template function exists"
else
    echo "  ❌ create-overlay-template function NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check App.tsx integration
echo "🔧 Checking App.tsx Integration..."
if grep -q "import OverlayGrid from './components/OverlayGrid'" src/App.tsx; then
    echo "  ✅ OverlayGrid import found in App.tsx"
else
    echo "  ❌ OverlayGrid import NOT FOUND in App.tsx"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "<OverlayGrid" src/App.tsx; then
    echo "  ✅ OverlayGrid component usage found in App.tsx"
else
    echo "  ❌ OverlayGrid component usage NOT FOUND in App.tsx"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check environment variables
echo "🔐 Checking Environment Variables..."
if [ -f ".env.local" ]; then
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        echo "  ✅ VITE_SUPABASE_URL found in .env.local"
    else
        echo "  ❌ VITE_SUPABASE_URL NOT FOUND in .env.local"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        echo "  ✅ VITE_SUPABASE_ANON_KEY found in .env.local"
    else
        echo "  ❌ VITE_SUPABASE_ANON_KEY NOT FOUND in .env.local"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ❌ .env.local file NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "========================================================"

if [ $ERRORS -eq 0 ]; then
    echo "✅ All integration files are in place!"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Execute SQL migration in Supabase SQL Editor"
    echo "  2. Deploy edge functions to Supabase"
    echo "  3. Configure overlayId in public/unified-overlay.html"
    echo "  4. Start development server: npm run dev"
    echo "  5. Test the integration"
    echo ""
    echo "📖 See UNIFIED_OVERLAY_INTEGRATION_GUIDE.md for detailed instructions"
else
    echo "❌ Found $ERRORS issue(s) - please review above"
fi

echo ""
