#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateOverlays() {
  console.log('🔧 Cleaning up and adding new overlays...\n')

  // Step 1: Remove duplicates/empty overlays
  const overlaysToRemove = [
    'claude_production_alert',
    'out_of_context_abe',
    'out_of_context_title',
    'show_title'
  ]

  console.log('🗑️  Removing duplicate/empty overlays...')
  for (const overlayType of overlaysToRemove) {
    const { error } = await supabase
      .from('broadcast_graphics')
      .delete()
      .eq('graphic_type', overlayType)

    if (error) {
      console.error(`❌ Failed to remove ${overlayType}:`, error.message)
    } else {
      console.log(`✅ Removed: ${overlayType}`)
    }
  }

  console.log('\n📦 Adding new overlay-package overlays...\n')

  // Step 2: Add new overlays from overlay-package
  const newOverlays = [
    {
      graphic_type: 'alpha_wednesday_universal',
      is_visible: false,
      html_file: '/overlay-package/alpha-wednesday-universal.html',
      position: 'fullscreen',
      config: {
        name: 'Alpha Wednesday Universal',
        description: 'Modern Alpha Wednesday broadcast overlay with WebSocket connection',
        audioEnabled: false,
        websocket: true,
        features: [
          'Real-time episode data from Universal Episode System',
          'WebSocket connection for instant updates',
          'Professional modern design',
          'Animated transitions',
          'Corner accents and styling'
        ]
      }
    },
    {
      graphic_type: 'alpha_wednesday_original_universal',
      is_visible: false,
      html_file: '/overlay-package/alpha-wednesday-original-universal.html',
      position: 'fullscreen',
      config: {
        name: 'Alpha Wednesday Original (Universal)',
        description: 'Original Alpha Wednesday design with smoke animation and Universal Episode System integration',
        audioEnabled: false,
        websocket: true,
        features: [
          'TRUE ORIGINAL Alpha Wednesday design preserved',
          'Smoke animation and original layout',
          'WebSocket connection for real-time updates',
          'Universal Episode System backend',
          'All original visual elements maintained'
        ]
      }
    },
    {
      graphic_type: 'the_live_stream_show',
      is_visible: false,
      html_file: '/overlay-package/TheLiveStreamShow.html',
      position: 'fullscreen',
      config: {
        name: 'The Live Stream Show',
        description: 'The Live Stream Show overlay with WebSocket functionality',
        audioEnabled: false,
        websocket: true,
        features: [
          'Unique visual design',
          'Corner accents',
          'WebSocket real-time updates',
          'Universal Episode System integration',
          'Professional broadcast styling'
        ]
      }
    }
  ]

  for (const overlay of newOverlays) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('broadcast_graphics')
      .select('id')
      .eq('graphic_type', overlay.graphic_type)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('broadcast_graphics')
        .update({
          html_file: overlay.html_file,
          position: overlay.position,
          config: overlay.config
        })
        .eq('id', existing.id)

      if (error) {
        console.error(`❌ Failed to update ${overlay.config.name}:`, error.message)
      } else {
        console.log(`🔄 Updated: ${overlay.config.name}`)
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('broadcast_graphics')
        .insert(overlay)
        .select()
        .single()

      if (error) {
        console.error(`❌ Failed to add ${overlay.config.name}:`, error.message)
      } else {
        console.log(`✅ Added: ${overlay.config.name} (ID: ${data.id})`)
      }
    }
  }

  console.log('\n📊 Verifying final overlay count...\n')

  // Count total overlays
  const { data: allOverlays, error: countError } = await supabase
    .from('broadcast_graphics')
    .select('graphic_type, config')
    .order('created_at', { ascending: false })

  if (countError) {
    console.error('❌ Error counting overlays:', countError.message)
  } else {
    console.log(`✅ Total overlays in database: ${allOverlays?.length || 0}\n`)
    
    console.log('📋 WebSocket-enabled overlays:')
    const websocketOverlays = allOverlays?.filter(o => o.config?.websocket === true)
    websocketOverlays?.forEach(o => {
      console.log(`  • ${o.config?.name || o.graphic_type}`)
    })
  }

  console.log('\n✅ Overlay cleanup and addition complete!')
  console.log('\n📝 Next Steps:')
  console.log('1. Move HTML files to /public/overlay-package/ directory')
  console.log('2. Restart dev server: npm run dev')
  console.log('3. Check Graphics tab in Director Panel')
  console.log('4. Test WebSocket connections for new overlays')
}

updateOverlays()
