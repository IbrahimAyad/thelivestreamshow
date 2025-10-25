#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function hideAll() {
  console.log('👀 Hiding all graphics...')
  
  const { error } = await supabase
    .from('broadcast_graphics')
    .update({ is_visible: false })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ All graphics hidden!')
  }
}

hideAll()
