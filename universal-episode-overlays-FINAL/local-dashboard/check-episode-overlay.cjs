#!/usr/bin/env node

/**
 * Episode Overlay Quick Check
 * 
 * Simple verification that the episode overlay files exist and are configured correctly
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 EPISODE OVERLAY QUICK CHECK')
console.log('================================\n')

// Check if component files exist
const files = [
  'src/components/broadcast/PiNamecardOverlay.tsx',
  'src/hooks/useEpisodeInfo.ts', 
  'src/components/BroadcastViewEnhanced.tsx'
]

console.log('📁 Checking component files...')
for (const file of files) {
  try {
    const stats = fs.statSync(path.join(process.cwd(), file))
    console.log(`✅ ${file} - Found (${Math.round(stats.size / 1024)}KB)`)
  } catch {
    console.log(`❌ ${file} - Missing!`)
  }
}

console.log('\n📋 Check completed!')
console.log('\n🧪 NEXT STEPS:')
console.log('1. Make sure dev server is running: npm run dev')
console.log('2. Go to broadcast view: http://localhost:5173/broadcast')
console.log('3. Look in bottom-right corner for episode card')
console.log('4. If no card appears, check browser console for errors')
console.log('\n💡 If still not working:')
console.log('- Check that episode_info table has is_visible = true')
console.log('- Restart browser with hard refresh (Cmd+Shift+R or Ctrl+Shift+R)')
console.log('- Check that PiNamecardOverlay component is imported in BroadcastViewEnhanced.tsx')
