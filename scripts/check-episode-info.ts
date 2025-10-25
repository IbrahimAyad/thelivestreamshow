#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkEpisodeInfo() {
  console.log('🔍 Checking episode_info table...\n')
  
  // Test basic select
  console.log('1️⃣ Test basic select:')
  const { data: d1, error: e1 } = await supabase
    .from('episode_info')
    .select('*')
    .limit(1)
  
  if (e1) {
    console.error('❌ Error:', e1.message, e1.code)
    console.error('   This table might not exist!')
  } else {
    console.log('✅ Table exists! Columns:', Object.keys(d1?.[0] || {}))
  }
  
  // Test the problematic query
  console.log('\n2️⃣ Test query with is_active and is_visible:')
  const { data: d2, error: e2 } = await supabase
    .from('episode_info')
    .select('*')
    .eq('is_active', true)
    .eq('is_visible', true)
    .single()
  
  if (e2) {
    console.error('❌ THIS IS THE FAILING QUERY!')
    console.error('   Message:', e2.message)
    console.error('   Code:', e2.code)
    console.error('   Details:', e2.details)
  } else {
    console.log('✅ Query works! Data:', d2)
  }
}

checkEpisodeInfo()
