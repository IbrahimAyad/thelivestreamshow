#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './supabase-config'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  console.log('🔍 Checking soundboard_effects table...\n')

  const { data, error } = await supabase
    .from('soundboard_effects')
    .select('*')

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${data?.length || 0} sound effects:\n`)
  data?.forEach((effect: any) => {
    console.log(`  - ${effect.effect_name} (${effect.effect_type})`)
    if (effect.audio_url) {
      console.log(`    Audio: ${effect.audio_url}`)
    }
  })

  console.log('\n🔍 Looking for "Finish Him"...\n')
  const finishHim = data?.find((e: any) => e.effect_type === 'finish_him')

  if (finishHim) {
    console.log('✅ FOUND Finish Him!')
    console.log(JSON.stringify(finishHim, null, 2))
  } else {
    console.log('❌ Finish Him NOT found in database')
  }

  process.exit(0)
}

check()
