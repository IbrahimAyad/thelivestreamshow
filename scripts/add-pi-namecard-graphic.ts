#!/usr/bin/env tsx
/**
 * Add Purposeful Illusion Namecard Overlay to broadcast_graphics table
 * 
 * This adds the professional stream overlay with:
 * - Season/Episode info
 * - Live status indicator
 * - Stream timer
 * - Viewer count
 * - Show title "Purposeful Illusion"
 * - Social handles
 * - Notification system
 * - Chat activity indicator
 */

import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addPINamecardGraphic() {
  console.log('🎨 Adding Purposeful Illusion Namecard Overlay to database...\n')

  const graphic = {
    graphic_type: 'pi_namecard_overlay',
    is_visible: false,
    html_file: '/pi-namecard-overlay.html',
    position: 'fullscreen',
    config: {
      name: 'PI Namecard Overlay',
      description: 'Professional stream overlay with season info, live status, timer, viewer count, and show title',
      audioEnabled: false,
      features: [
        'Season/Episode badges',
        'Live status indicator',
        'Stream timer',
        'Viewer count',
        'Show title: "Purposeful Illusion"',
        'Social handles (@abalivestream)',
        'Notification system',
        'Chat activity indicator',
        'Corner accents',
        'Animated background gradient'
      ],
      controls: {
        toggleStatus: 'Press S to toggle LIVE/OFFLINE',
        showNotification: 'Press N to trigger notification',
        customizable: 'Edit season/episode numbers, show title, social handles in HTML'
      }
    }
  }

  console.log('Checking if pi_namecard_overlay already exists...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('broadcast_graphics')
    .select('id')
    .eq('graphic_type', 'pi_namecard_overlay')
    .single()

  if (existing) {
    console.log(`  ℹ️  pi_namecard_overlay already exists (ID: ${existing.id})`)
    console.log('  🔄 Updating configuration...')

    const { error: updateError } = await supabase
      .from('broadcast_graphics')
      .update({
        html_file: graphic.html_file,
        position: graphic.position,
        config: graphic.config
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('  ❌ Failed to update:', updateError.message)
      process.exit(1)
    } else {
      console.log('  ✅ Updated pi_namecard_overlay configuration')
    }
  } else {
    // Insert new graphic
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .insert(graphic)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert pi_namecard_overlay:`, error.message)
      process.exit(1)
    } else {
      console.log(`  ✅ Added pi_namecard_overlay (ID: ${data.id})`)
    }
  }

  console.log('\n📋 Graphic Details:')
  console.log('   Type: pi_namecard_overlay')
  console.log('   File: /pi-namecard-overlay.html')
  console.log('   Position: fullscreen')
  console.log('\n💡 How to Use:')
  console.log('   1. Open Director Panel → Graphics tab')
  console.log('   2. Find "PI Namecard Overlay"')
  console.log('   3. Click "Show" to display')
  console.log('   4. Press S to toggle LIVE/OFFLINE status')
  console.log('   5. Press N to trigger test notifications')
  console.log('\n🎨 Customization:')
  console.log('   Edit /public/pi-namecard-overlay.html to change:')
  console.log('   - Season/Episode numbers')
  console.log('   - Show title')
  console.log('   - Social handles')
  console.log('   - Colors and styling')
  console.log('\n✨ Done!')
  process.exit(0)
}

addPINamecardGraphic()
