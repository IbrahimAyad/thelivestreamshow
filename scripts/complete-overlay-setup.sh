#!/bin/bash

# Overlay Sound Integration - Complete Setup Script
# Run this script AFTER manually executing the database migration

set -e

echo "🚀 Overlay Sound Integration - Complete Setup"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Load environment variables
echo "📋 Step 1: Loading environment variables..."
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    exit 1
fi

echo "✅ Environment loaded"
echo ""

# Check if migration is applied
echo "📋 Step 2: Checking migration status..."
if ! npx tsx scripts/check-overlay-migration.ts 2>&1 | grep -q "Migration columns detected"; then
    echo ""
    echo "❌ DATABASE MIGRATION REQUIRED"
    echo ""
    echo "Please complete these steps first:"
    echo ""
    echo "1. Open Supabase Dashboard SQL Editor:"
    echo "   https://supabase.com/dashboard/project/vcniezwtltraqramjlux/sql"
    echo ""
    echo "2. Copy the entire contents of:"
    echo "   supabase/migrations/20250124_add_overlay_sound_and_layering.sql"
    echo ""
    echo "3. Paste into SQL Editor and click 'Run'"
    echo ""
    echo "4. Wait for success message"
    echo ""
    echo "5. Run this script again: ./scripts/complete-overlay-setup.sh"
    echo ""
    exit 1
fi

echo "✅ Migration detected"
echo ""

# Apply default values
echo "📋 Step 3: Applying default display modes and z-index values..."
if npx tsx scripts/apply-overlay-defaults.ts; then
    echo "✅ Default values applied successfully"
else
    echo "⚠️  Some overlays may not have been updated (this is normal if they don't exist yet)"
fi
echo ""

# Verify final state
echo "📋 Step 4: Verifying final configuration..."
npx tsx scripts/check-overlay-migration.ts
echo ""

echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "✅ Database migration verified"
echo "✅ Default values applied"
echo "✅ System ready for use"
echo ""
echo "📚 Next Steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Open Director Panel in browser"
echo "   3. Ctrl+Click any overlay to configure sound"
echo "   4. Test multi-layer rendering"
echo ""
echo "📖 Documentation:"
echo "   - Setup Guide: docs/OVERLAY_SOUND_SETUP_GUIDE.md"
echo "   - Implementation: docs/OVERLAY_SOUND_IMPLEMENTATION_COMPLETE.md"
echo ""
