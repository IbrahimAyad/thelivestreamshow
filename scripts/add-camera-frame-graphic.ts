#!/usr/bin/env tsx
/**
 * Add Cyberpunk Camera Frame Overlay to broadcast_graphics table
 *
 * This adds the camera frame overlay with:
 * - Transparent area for webcam
 * - Holographic border with pulsing animation
 * - Corner brackets with glow effects
 * - Scanning line effect
 * - Live viewer count
 * - Chat activity indicator
 */

import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addCameraFrameGraphic() {
  console.log('🎨 Adding Cyberpunk Camera Frame Overlay to database...\n')

  const graphic = {
    graphic_type: 'camera_frame_cyberpunk',
    is_visible: false,
    html_file: '/camera-frame-overlay.html',
    position: 'fullscreen',
    config: {
      name: 'Camera Frame - Cyberpunk',
      description: 'Cyberpunk holographic camera frame with viewer count and chat activity',
      audioEnabled: false,
      features: [
        'Transparent camera area (400x300px)',
        'Holographic border with pulsing animation (red ↔ gold)',
        'Corner brackets with glow effects',
        'Scanning line effect',
        'Live viewer count with animated icon',
        'Chat activity indicator with wave animation',
        'Bottom-right positioning'
      ],
      positioning: {
        cameraArea: 'Bottom-right, 400x300px',
        viewerCount: 'Above camera frame',
        chatActivity: 'Above camera frame, left of viewer count'
      },
      styling: {
        borderColors: 'Red and gold with pulse animation',
        background: 'Fully transparent for OBS chroma key',
        glowEffects: 'Animated corner brackets and scanning line'
      }
    }
  }

  console.log('Checking if camera_frame_cyberpunk already exists...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('broadcast_graphics')
    .select('id')
    .eq('graphic_type', 'camera_frame_cyberpunk')
    .single()

  if (existing) {
    console.log(`  ℹ️  camera_frame_cyberpunk already exists (ID: ${existing.id})`)
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
      console.log('  ✅ Updated camera_frame_cyberpunk configuration')
    }
  } else {
    // Insert new graphic
    const { data, error } = await supabase
      .from('broadcast_graphics')
      .insert(graphic)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert camera_frame_cyberpunk:`, error.message)
      process.exit(1)
    } else {
      console.log(`  ✅ Added camera_frame_cyberpunk (ID: ${data.id})`)
    }
  }

  console.log('\n📋 Graphic Details:')
  console.log('   Type: camera_frame_cyberpunk')
  console.log('   File: /camera-frame-overlay.html')
  console.log('   Position: fullscreen (camera at bottom-right)')
  console.log('\n💡 How to Use:')
  console.log('   1. Open Dashboard → Graphics Overlays')
  console.log('   2. Find "Camera Frame - Cyberpunk"')
  console.log('   3. Click to toggle visibility')
  console.log('   4. Add your webcam source in OBS')
  console.log('   5. Position webcam at bottom-right (400x300px)')
  console.log('\n🎥 OBS Setup:')
  console.log('   1. Add Browser Source: http://localhost:5173/broadcast')
  console.log('   2. Add your webcam as Video Capture Device')
  console.log('   3. Position webcam at bottom-right (400x300px)')
  console.log('   4. The holographic border will frame your webcam')
  console.log('\n🎨 Features:')
  console.log('   ✓ Transparent background (OBS ready)')
  console.log('   ✓ Pulsing holographic border (red ↔ gold)')
  console.log('   ✓ Animated corner brackets')
  console.log('   ✓ Scanning line effect')
  console.log('   ✓ Live viewer count (simulated)')
  console.log('   ✓ Chat activity indicator (simulated)')
  console.log('\n✨ Done!')
  process.exit(0)
}

addCameraFrameGraphic()
