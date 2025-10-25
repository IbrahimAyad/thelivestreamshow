#!/usr/bin/env tsx
/**
 * Add FINISH HIM Mortal Kombat sound to the soundboard
 */

import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addFinishHimSound() {
  console.log('🔊 Adding FINISH HIM sound to soundboard...\n')

  const soundEffect = {
    effect_name: 'Finish Him',
    effect_type: 'finish_him',
    audio_url: '/mk_finish_him.mp3',
    volume: 100,
    is_playing: false
  }

  console.log('Checking if "Finish Him" already exists...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('soundboard_effects')
    .select('id')
    .eq('effect_type', 'finish_him')
    .single()

  if (existing) {
    console.log(`  ℹ️  Finish Him already exists (ID: ${existing.id})`)
    console.log('  🔄 Updating configuration...')

    const { error: updateError } = await supabase
      .from('soundboard_effects')
      .update({
        effect_name: soundEffect.effect_name,
        audio_url: soundEffect.audio_url,
        volume: soundEffect.volume
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('  ❌ Failed to update:', updateError.message)
      process.exit(1)
    } else {
      console.log('  ✅ Updated Finish Him sound')
    }
  } else {
    // Insert new sound effect
    const { data, error } = await supabase
      .from('soundboard_effects')
      .insert(soundEffect)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ Failed to insert Finish Him:`, error.message)
      process.exit(1)
    } else {
      console.log(`  ✅ Added Finish Him (ID: ${data.id})`)
    }
  }

  console.log('\n📋 Sound Effect Details:')
  console.log('   Name: Finish Him')
  console.log('   Type: finish_him')
  console.log('   File: /mk_finish_him.mp3')
  console.log('   Volume: 100%')
  console.log('\n💡 How to Use:')
  console.log('   1. Open Dashboard → Soundboard Panel')
  console.log('   2. Find "Finish Him" button')
  console.log('   3. Click to play the Mortal Kombat sound!')
  console.log('\n✨ Done!')
  process.exit(0)
}

addFinishHimSound()
