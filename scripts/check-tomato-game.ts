#!/usr/bin/env tsx
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkGame() {
  const { data, error } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .eq('graphic_type', 'tomato_chat_game')
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('✅ Tomato Chat Game found in database!')
  console.log('\nDetails:', JSON.stringify(data, null, 2))
}

checkGame()
