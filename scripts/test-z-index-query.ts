#!/usr/bin/env tsx
import { supabaseUrl, supabaseAnonKey } from './supabase-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing z_index query...\n')
  
  // Test 1: Simple select
  console.log('1️⃣ Test simple select with z_index:')
  const { data: d1, error: e1 } = await supabase
    .from('broadcast_graphics')
    .select('id, graphic_type, z_index')
    .limit(3)
  
  if (e1) {
    console.error('❌ Error:', e1.message, e1.hint, e1.details)
  } else {
    console.log('✅ Success:', d1)
  }
  
  // Test 2: With order
  console.log('\n2️⃣ Test with order by z_index:')
  const { data: d2, error: e2 } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .order('z_index', { ascending: true })
    .limit(3)
  
  if (e2) {
    console.error('❌ Error:', e2.message)
    console.error('   Code:', e2.code)
    console.error('   Details:', e2.details)
    console.error('   Hint:', e2.hint)
  } else {
    console.log('✅ Success! Records:', d2?.length)
  }
  
  // Test 3: With is_visible filter AND order
  console.log('\n3️⃣ Test with is_visible=true AND order:')
  const { data: d3, error: e3 } = await supabase
    .from('broadcast_graphics')
    .select('*')
    .eq('is_visible', true)
    .order('z_index', { ascending: true })
  
  if (e3) {
    console.error('❌ THIS IS THE FAILING QUERY!')
    console.error('   Message:', e3.message)
    console.error('   Code:', e3.code)
    console.error('   Details:', e3.details)
    console.error('   Hint:', e3.hint)
  } else {
    console.log('✅ Success! Records:', d3?.length)
  }
}

test()
